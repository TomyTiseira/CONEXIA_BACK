import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { envs } from '../config/envs';
import { NATS_SERVICE } from '../config/service';

interface MercadoPagoWebhookQuery {
  'data.id': string;
  type: string;
}

export interface MercadoPagoWebhookDto {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: string;
  live_mode: boolean;
  type: string;
  user_id: number;
}

@Controller('webhooks')
export class WebhooksController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('mercadopago')
  verifyMercadoPagoWebhook(@Res() res: Response) {
    // Endpoint para verificación de webhook por parte de MercadoPago
    return res.status(200).json({
      status: 'ok',
      message: 'MercadoPago webhook endpoint is ready',
    });
  }

  @Post('mercadopago')
  handleMercadoPagoWebhook(
    @Query() query: MercadoPagoWebhookQuery,
    @Body() body: MercadoPagoWebhookDto,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      console.log('🔔 MercadoPago Webhook received:', {
        query,
        body,
        headers: {
          'x-signature': headers['x-signature'],
          'x-request-id': headers['x-request-id'],
        },
      });

      // 1. Validar firma de seguridad (solo en producción)
      const isDevelopment = envs.nodeEnv === 'development';

      console.log('🔧 Environment check:', {
        NODE_ENV: envs.nodeEnv,
        isDevelopment,
      });

      if (!isDevelopment) {
        const isValidSignature = this.validateWebhookSignature(query, headers);
        if (!isValidSignature) {
          console.error('❌ Invalid webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
        console.log('✅ Webhook signature validated');
      } else {
        console.log('🔧 Development mode: Skipping signature validation');
      }

      // 2. Detectar tipo de webhook basado en el ID recibido
      const webhookId = query['data.id'] || body.data?.id;
      const webhookType = query.type || body.type;

      console.log('🔍 Analyzing webhook:', {
        webhookId,
        webhookType,
        idPattern: webhookId?.match(/^(\d+)-/)
          ? 'preference_format'
          : 'payment_format',
        action: body.action,
      });

      // 3. Procesar webhooks de PAGOS (ID numérico simple)
      if (webhookType === 'payment' && webhookId && !webhookId.includes('-')) {
        console.log('💰 Processing PAYMENT webhook:', {
          paymentId: webhookId,
          action: body.action,
          live_mode: body.live_mode,
        });

        // Enviar a microservicio para procesar
        this.client
          .send('process_payment_webhook', {
            paymentId: webhookId,
            action: body.action,
            webhookData: body,
          })
          .subscribe({
            next: (result) =>
              console.log('✅ Payment webhook processed successfully:', result),
            error: (error) =>
              console.error('❌ Error processing payment webhook:', error),
          });

        console.log('📤 Payment webhook sent to services microservice');
      } else if (
        webhookType === 'payment' &&
        webhookId &&
        webhookId.includes('-')
      ) {
        // 4. Procesar webhooks de PREFERENCIAS (ID con formato collector-preference)
        console.log(
          '📋 Processing PREFERENCE webhook (might contain payment info):',
          {
            preferenceId: webhookId,
            action: body.action,
          },
        );

        // Enviar a microservicio para procesar preferencia y obtener pagos relacionados
        this.client
          .send('process_preference_webhook', {
            preferenceId: webhookId,
            action: body.action,
            webhookData: body,
          })
          .subscribe({
            next: (result) =>
              console.log(
                '✅ Preference webhook processed successfully:',
                result,
              ),
            error: (error) =>
              console.error('❌ Error processing preference webhook:', error),
          });

        console.log('📤 Preference webhook sent to services microservice');
      } else {
        console.log(
          'ℹ️ Webhook ignored - not a recognized payment/preference update:',
          {
            type: webhookType,
            id: webhookId,
            action: body.action,
          },
        );
      }

      // 4. Responder 200 OK inmediatamente
      return res.status(200).json({
        status: 'ok',
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      console.error('❌ Error processing webhook:', error);

      // Responder 200 para evitar reintentos
      return res.status(200).json({
        status: 'error',
        message: 'Error processed but acknowledged',
      });
    }
  }

  private validateWebhookSignature(
    query: MercadoPagoWebhookQuery,
    headers: Record<string, string>,
  ): boolean {
    try {
      const xSignature = headers['x-signature'];
      const xRequestId = headers['x-request-id'];

      if (!xSignature || !xRequestId) {
        console.error('Missing signature headers');
        return false;
      }

      // Extraer timestamp y hash
      const parts = xSignature.split(',');
      let ts: string = '';
      let hash: string = '';

      parts.forEach((part) => {
        const [key, value] = part.split('=');
        if (key.trim() === 'ts') ts = value.trim();
        if (key.trim() === 'v1') hash = value.trim();
      });

      if (!ts || !hash) {
        console.error('Invalid signature format');
        return false;
      }

      // Crear manifest según documentación
      const dataId = query['data.id'];
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      // Generar HMAC SHA256
      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
      if (!secret) {
        console.error('MERCADOPAGO_WEBHOOK_SECRET not configured');
        return false;
      }

      const generatedHash = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

      const isValid = generatedHash === hash;

      console.log('🔐 Signature validation:', {
        manifest,
        expectedHash: hash,
        generatedHash,
        isValid,
      });

      return isValid;
    } catch (error) {
      console.error('Error validating signature:', error);
      return false;
    }
  }
}
