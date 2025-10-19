import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { ClaimsController } from './claims.controller';
import { ServiceHiringsController } from './service-hirings.controller';

@Module({
  imports: [NatsModule],
  controllers: [ServiceHiringsController, ClaimsController],
  providers: [],
})
export class ServiceHiringsModule {}
