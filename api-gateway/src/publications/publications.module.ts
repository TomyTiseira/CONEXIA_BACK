import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { PublicationsController } from './publications.controller';

@Module({
  imports: [NatsModule],
  controllers: [PublicationsController],
})
export class PublicationsModule {}
