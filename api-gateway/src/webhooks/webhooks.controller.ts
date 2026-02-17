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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { envs } from '../config/envs';
import { NATS_SERVICE } from '../config/service';

interface MercadoPagoWebhookQuery {
  'data.id'?: string;
  type?: string;
  id?: string;
  topic?: string;
  [key: string]: any; // Permitir campos adicionales
}

export interface MercadoPagoWebhookDto {
  action?: string;
  api_version?: string;
  data?: {
    id: string;
    [key: string]: any; // Permitir campos adicionales en data
  };
  date_created?: string;
  id?: string;
  live_mode?: boolean;
  type?: string;
  user_id?: number;
  topic?: string;
  [key: string]: any; // Permitir campos adicionales en el body
}

@Controller('webhooks')
export class WebhooksController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('mercadopago')
  verifyMercadoPagoWebhook(@Res() res: Response) {
    // Endpoint para verificación de webhook por parte de MercadoPago
    // Agregar header para omitir página de verificación de ngrok
    res.setHeader('ngrok-skip-browser-warning', 'true');
    return res.status(200).json({
      status: 'ok',
      message: 'MercadoPago webhook endpoint is ready',
    });
  }

  @Post('mercadopago')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: false, // No eliminar campos no declarados
      forbidNonWhitelisted: false, // No rechazar campos adicionales
    }),
  )
  async handleMercadoPagoWebhook(
    @Query() query: MercadoPagoWebhookQuery,
    @Body() body: MercadoPagoWebhookDto,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Agregar header para omitir página de verificación de ngrok
      res.setHeader('ngrok-skip-browser-warning', 'true');

      // 1. Validar firma de seguridad (solo en producción)
      const isDevelopment = envs.nodeEnv === 'development';

      if (!isDevelopment) {
        const isValidSignature = this.validateWebhookSignature(query, headers);
        if (!isValidSignature) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      // 2. Detectar tipo de webhook basado en el ID recibido
      const webhookId = query['data.id'] || body.data?.id || query.id;
      const webhookType = query.type || body.type || query.topic || body.topic;

      // Ignorar webhooks de merchant_order (no son pagos reales)
      if (webhookType === 'merchant_order') {
        return res.status(200).json({
          status: 'ok',
          message: 'Merchant order webhook acknowledged but not processed',
        });
      }

      // 3. Procesar webhooks de PAGOS (ID numérico simple)
      const isPaymentWebhook = webhookType === 'payment';
      const isSimplePaymentId = webhookId && !webhookId.includes('-');

      if (isPaymentWebhook && isSimplePaymentId) {
        // Procesar webhooks de forma síncrona con timeout de 10 segundos
        try {
          // Enviar a microservicio de servicios y esperar respuesta
          await firstValueFrom(
            this.client
              .send('process_payment_webhook', {
                paymentId: webhookId,
                action: body.action,
                webhookData: body,
              })
              .pipe(
                timeout(10000),
                catchError((error) => {
                  return of({
                    success: false,
                    error: error.message,
                    microservice: 'services',
                  });
                }),
              ),
          );

          // Enviar a microservicio de memberships (procesará si es suscripción)
          await firstValueFrom(
            this.client
              .send('processSubscriptionPaymentWebhook', {
                paymentId: parseInt(webhookId, 10),
              })
              .pipe(
                timeout(10000),
                catchError((error) => {
                  return of({
                    success: false,
                    error: error.message,
                    microservice: 'memberships',
                  });
                }),
              ),
          );
        } catch {
          // Continuar para retornar 200 y que MercadoPago reintente después
        }
      } else if (webhookType === 'subscription_authorized_payment') {
        // Procesar webhooks de FACTURAS DE SUSCRIPCIÓN (authorized_payments)
        try {
          // Enviar a microservicio de memberships y esperar respuesta
          await firstValueFrom(
            this.client
              .send('processSubscriptionInvoiceWebhook', {
                authorizedPaymentId: webhookId,
              })
              .pipe(
                timeout(10000),
                catchError((error) => {
                  return of({ success: false, error: error.message });
                }),
              ),
          );
        } catch {
          // Continuar
        }
      } else if (
        webhookType === 'subscription_preapproval' ||
        webhookType === 'preapproval'
      ) {
        // Procesar webhooks de SUSCRIPCIONES CREADAS (preapproval)
        try {
          // Enviar a microservicio de memberships y esperar respuesta
          await firstValueFrom(
            this.client
              .send('processPreapprovalWebhook', {
                preapprovalId: webhookId,
                action: body.action,
              })
              .pipe(
                timeout(10000),
                catchError((error) => {
                  return of({ success: false, error: error.message });
                }),
              ),
          );
        } catch {
          // Continuar
        }
      } else if (
        webhookType === 'payment' &&
        webhookId &&
        webhookId.includes('-')
      ) {
        // 4. Procesar webhooks de PREFERENCIAS (ID con formato collector-preference)
        try {
          // Enviar a microservicio para procesar preferencia y esperar respuesta
          await firstValueFrom(
            this.client
              .send('process_preference_webhook', {
                preferenceId: webhookId,
                action: body.action,
                webhookData: body,
              })
              .pipe(
                timeout(10000),
                catchError((error) => {
                  return of({ success: false, error: error.message });
                }),
              ),
          );
        } catch {
          // Continuar
        }
      } else {
        // FALLBACK: Intentar detectar si hay un ID de pago válido de todas formas
        // PERO ignorar merchant_orders que ya fueron filtrados arriba
        const possiblePaymentId = webhookId || query.id || body.id;
        if (
          possiblePaymentId &&
          /^\d+$/.test(String(possiblePaymentId)) &&
          webhookType !== 'merchant_order'
        ) {
          try {
            // Enviar a microservicio de servicios y esperar respuesta
            await firstValueFrom(
              this.client
                .send('process_payment_webhook', {
                  paymentId: String(possiblePaymentId),
                  action: body.action,
                  webhookData: body,
                })
                .pipe(
                  timeout(10000),
                  catchError((error) => {
                    return of({ success: false, error: error.message });
                  }),
                ),
            );

            // Enviar a microservicio de memberships (procesará si es suscripción)
            await firstValueFrom(
              this.client
                .send('processSubscriptionPaymentWebhook', {
                  paymentId: parseInt(String(possiblePaymentId), 10),
                })
                .pipe(
                  timeout(10000),
                  catchError((error) => {
                    return of({ success: false, error: error.message });
                  }),
                ),
            );
          } catch {
            // Continuar
          }
        }
      }

      // 4. Responder 200 OK después de procesar
      return res.status(200).json({
        status: 'ok',
        message: 'Webhook processed successfully',
      });
    } catch {
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
        return false;
      }

      // Crear manifest según documentación
      const dataId = query['data.id'];
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      // Generar HMAC SHA256
      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
      if (!secret) {
        return false;
      }

      const generatedHash = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

      return generatedHash === hash;
    } catch {
      return false;
    }
  }
}
