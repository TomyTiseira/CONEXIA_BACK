import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
    CreateServiceReviewDto,
    GetServiceReviewsDto,
    RespondServiceReviewDto,
    UpdateServiceReviewDto,
} from './dto';
import { ServiceReviewRepository } from './repositories/service-review.repository';
import { CreateServiceReviewUseCase } from './services/use-cases/create-service-review.use-case';
import { DeleteServiceReviewUseCase } from './services/use-cases/delete-service-review.use-case';
import { GetServiceReviewsUseCase } from './services/use-cases/get-service-reviews.use-case';
import { RespondToServiceReviewUseCase } from './services/use-cases/respond-to-service-review.use-case';
import { UpdateServiceReviewUseCase } from './services/use-cases/update-service-review.use-case';

@Controller()
export class ServiceReviewsController {
  constructor(
    private readonly createReviewUseCase: CreateServiceReviewUseCase,
    private readonly getReviewsUseCase: GetServiceReviewsUseCase,
    private readonly updateReviewUseCase: UpdateServiceReviewUseCase,
    private readonly deleteReviewUseCase: DeleteServiceReviewUseCase,
    private readonly respondToReviewUseCase: RespondToServiceReviewUseCase,
    private readonly reviewRepository: ServiceReviewRepository,
  ) {}

  @MessagePattern('create_service_review')
  async createReview(
    @Payload() payload: { userId: number; dto: CreateServiceReviewDto },
  ) {
    return await this.createReviewUseCase.execute(payload.userId, payload.dto);
  }

  @MessagePattern('get_service_reviews')
  async getServiceReviews(
    @Payload() payload: { serviceId: number; dto: GetServiceReviewsDto; userId?: number },
  ) {
    return await this.getReviewsUseCase.execute(
      payload.serviceId,
      payload.dto,
      payload.userId,
    );
  }

  @MessagePattern('get_service_review_by_hiring')
  async getByHiring(@Payload() payload: { hiringId: number }) {
    return await this.reviewRepository.findByHiringId(payload.hiringId);
  }

  @MessagePattern('update_service_review')
  async updateReview(
    @Payload()
    payload: {
      userId: number;
      reviewId: number;
      dto: UpdateServiceReviewDto;
    },
  ) {
    return await this.updateReviewUseCase.execute(
      payload.userId,
      payload.reviewId,
      payload.dto,
    );
  }

  @MessagePattern('respond_to_service_review')
  async respondToReview(
    @Payload()
    payload: {
      userId: number;
      reviewId: number;
      dto: RespondServiceReviewDto;
    },
  ) {
    return await this.respondToReviewUseCase.execute(
      payload.userId,
      payload.reviewId,
      payload.dto,
    );
  }

  @MessagePattern('delete_service_review')
  async deleteReview(
    @Payload() payload: { userId: number; reviewId: number },
  ) {
    await this.deleteReviewUseCase.execute(payload.userId, payload.reviewId);
    return { success: true };
  }
}
