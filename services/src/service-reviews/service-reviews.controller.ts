import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateServiceReviewDto,
  GetServiceReviewsDto,
  RespondServiceReviewDto,
  UpdateServiceReviewDto,
} from './dto';
import { ServiceReviewsService } from './services/service-reviews.service';

@Controller()
export class ServiceReviewsController {
  constructor(
    private readonly serviceReviewsService: ServiceReviewsService,
  ) {}

  @MessagePattern('create_service_review')
  async createReview(
    @Payload() payload: { userId: number; dto: CreateServiceReviewDto },
  ) {
    return await this.serviceReviewsService.createReview(payload.userId, payload.dto);
  }

  @MessagePattern('get_service_reviews')
  async getServiceReviews(
    @Payload() payload: { serviceId: number; dto: GetServiceReviewsDto; userId?: number },
  ) {
    return await this.serviceReviewsService.getReviews(
      payload.serviceId,
      payload.dto,
      payload.userId,
    );
  }

  @MessagePattern('get_service_review_by_hiring')
  async getByHiring(@Payload() payload: { hiringId: number }) {
    return await this.serviceReviewsService.getReviews(payload.hiringId, {});
  }

  @MessagePattern('get_service_review_by_id')
  async getReviewById(
    @Payload() payload: { reviewId: number; userId?: number },
  ) {
    return await this.serviceReviewsService.getReviewById(
      payload.reviewId,
      payload.userId,
    );
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
    return await this.serviceReviewsService.updateReview(
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
    return await this.serviceReviewsService.respondToReview(
      payload.userId,
      payload.reviewId,
      payload.dto,
    );
  }

  @MessagePattern('delete_service_review')
  async deleteReview(
    @Payload() payload: { userId: number; reviewId: number },
  ) {
    await this.serviceReviewsService.deleteReview(payload.userId, payload.reviewId);
    return { success: true };
  }

  @MessagePattern('delete_service_review_response')
  async deleteReviewResponse(
    @Payload() payload: { userId: number; reviewId: number },
  ) {
    return await this.serviceReviewsService.deleteReviewResponse(
      payload.userId,
      payload.reviewId,
    );
  }
}
