import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { ServiceReviewsController } from './service-reviews.controller';

@Module({
  imports: [NatsModule],
  controllers: [ServiceReviewsController],
  providers: [],
})
export class ServiceReviewsModule {}
