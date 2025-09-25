import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { ServiceHiringsController } from './service-hirings.controller';

@Module({
  imports: [NatsModule],
  controllers: [ServiceHiringsController],
  providers: [],
})
export class ServiceHiringsModule {}
