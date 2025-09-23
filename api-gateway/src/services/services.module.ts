import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { ServicesController } from './services.controller';

@Module({
  imports: [NatsModule],
  controllers: [ServicesController],
})
export class ServicesModule {}
