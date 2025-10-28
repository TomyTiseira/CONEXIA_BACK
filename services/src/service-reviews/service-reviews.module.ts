import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { ServiceHiringsModule } from '../service-hirings/service-hirings.module';
import { ServiceReview } from './entities/service-review.entity';
import { ServiceReviewRepository } from './repositories/service-review.repository';
import { ServiceReviewsController } from './service-reviews.controller';
import { CreateServiceReviewUseCase } from './services/use-cases/create-service-review.use-case';
import { DeleteServiceReviewUseCase } from './services/use-cases/delete-service-review.use-case';
import { DeleteServiceReviewResponseUseCase } from './services/use-cases/delete-service-review-response.use-case';
import { GetServiceReviewsUseCase } from './services/use-cases/get-service-reviews.use-case';
import { RespondToServiceReviewUseCase } from './services/use-cases/respond-to-service-review.use-case';
import { UpdateServiceReviewUseCase } from './services/use-cases/update-service-review.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceReview]),
    forwardRef(() => ServiceHiringsModule),
    CommonModule,
  ],
  controllers: [ServiceReviewsController],
  providers: [
    ServiceReviewRepository,
    CreateServiceReviewUseCase,
    GetServiceReviewsUseCase,
    UpdateServiceReviewUseCase,
    DeleteServiceReviewUseCase,
    DeleteServiceReviewResponseUseCase,
    RespondToServiceReviewUseCase,
  ],
  exports: [ServiceReviewRepository],
})
export class ServiceReviewsModule {}
