import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { NATS_SERVICE } from '../config/service';

export interface MercadoPagoWebhookDto {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: string;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

@Controller('webhooks')
export class WebhooksController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('mercadopago')
  handleMercadoPagoWebhook(@Body() webhookData: MercadoPagoWebhookDto) {
    return this.client.send('handleMercadoPagoWebhook', webhookData).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
