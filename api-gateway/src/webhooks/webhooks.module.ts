import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVICE } from '../config/service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URI || 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
