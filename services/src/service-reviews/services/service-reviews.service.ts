import { Injectable } from '@nestjs/common';
import {
  CreateServiceReviewDto,
  GetServiceReviewsDto,
  RespondServiceReviewDto,
  UpdateServiceReviewDto,
} from '../dto';
import { CreateServiceReviewUseCase } from './use-cases/create-service-review.use-case';
import { DeleteServiceReviewResponseUseCase } from './use-cases/delete-service-review-response.use-case';
import { DeleteServiceReviewUseCase } from './use-cases/delete-service-review.use-case';
import { GetServiceReviewByIdUseCase } from './use-cases/get-service-review-by-id.use-case';
import { GetServiceReviewsUseCase } from './use-cases/get-service-reviews.use-case';
import { RespondToServiceReviewUseCase } from './use-cases/respond-to-service-review.use-case';
import { UpdateServiceReviewUseCase } from './use-cases/update-service-review.use-case';

@Injectable()
export class ServiceReviewsService {
  constructor(
    private readonly createReviewUseCase: CreateServiceReviewUseCase,
    private readonly getReviewsUseCase: GetServiceReviewsUseCase,
    private readonly getReviewByIdUseCase: GetServiceReviewByIdUseCase,
    private readonly updateReviewUseCase: UpdateServiceReviewUseCase,
    private readonly deleteReviewUseCase: DeleteServiceReviewUseCase,
    private readonly deleteReviewResponseUseCase: DeleteServiceReviewResponseUseCase,
    private readonly respondToReviewUseCase: RespondToServiceReviewUseCase,
  ) {}

  async createReview(userId: number, dto: CreateServiceReviewDto) {
    return await this.createReviewUseCase.execute(userId, dto);
  }

  async getReviews(
    serviceId: number,
    dto: GetServiceReviewsDto,
    userId?: number,
  ) {
    return await this.getReviewsUseCase.execute(serviceId, dto, userId);
  }

  async getReviewById(reviewId: number, userId?: number) {
    return await this.getReviewByIdUseCase.execute(reviewId, userId);
  }

  async updateReview(
    userId: number,
    reviewId: number,
    dto: UpdateServiceReviewDto,
  ) {
    return await this.updateReviewUseCase.execute(userId, reviewId, dto);
  }

  async deleteReview(userId: number, reviewId: number) {
    return await this.deleteReviewUseCase.execute(userId, reviewId);
  }

  async deleteReviewResponse(userId: number, reviewId: number) {
    return await this.deleteReviewResponseUseCase.execute(userId, reviewId);
  }

  async respondToReview(
    userId: number,
    reviewId: number,
    dto: RespondServiceReviewDto,
  ) {
    return await this.respondToReviewUseCase.execute(userId, reviewId, dto);
  }
}
