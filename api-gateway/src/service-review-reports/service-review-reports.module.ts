import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { ServiceReviewReportsController } from './service-review-reports.controller';

@Module({
  imports: [NatsModule],
  controllers: [ServiceReviewReportsController],
})
export class ServiceReviewReportsModule {}
