import { Module } from '@nestjs/common';
import { ClaimsStorageModule } from '../common/claims-storage.module';
import { DeliveryStorageModule } from '../common/delivery-storage.module';
import { NatsModule } from '../transports/nats.module';
import { ClaimsController } from './claims.controller';
import { CompliancesController } from './compliances.controller';
import { ServiceHiringsController } from './service-hirings.controller';

@Module({
  imports: [NatsModule, DeliveryStorageModule, ClaimsStorageModule],
  controllers: [
    ServiceHiringsController,
    ClaimsController,
    CompliancesController,
  ],
  providers: [],
})
export class ServiceHiringsModule {}
