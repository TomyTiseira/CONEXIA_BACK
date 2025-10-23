import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { UserReviewsController } from './user-reviews.controller';

@Module({
  imports: [NatsModule],
  controllers: [UserReviewsController],
  providers: [],
})
export class UserReviewsModule {}
