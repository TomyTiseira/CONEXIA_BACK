import { Module } from '@nestjs/common';
import { DeliveryStorageModule } from '../common/delivery-storage.module';
import { NatsModule } from '../transports/nats.module';
import { ClaimsController } from './claims.controller';
import { CompliancesController } from './compliances.controller';
import { ServiceHiringsController } from './service-hirings.controller';

@Module({
  imports: [NatsModule, DeliveryStorageModule],
  controllers: [
    ServiceHiringsController,
    ClaimsController,
    CompliancesController,
  ],
  providers: [],
})
export class ServiceHiringsModule {}
