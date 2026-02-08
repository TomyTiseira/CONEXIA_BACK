import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  ReviewDeleteForbiddenException,
  ReviewHasAssociatedReportsException,
  ServiceReviewInternalServerErrorException,
  ServiceReviewNotFoundException,
} from '../../../common/exceptions/service-review.exceptions';
import { ServiceReviewRepository } from '../../repositories/service-review.repository';

@Injectable()
export class DeleteServiceReviewUseCase {
  constructor(private readonly reviewRepository: ServiceReviewRepository) {}

  async execute(userId: number, reviewId: number): Promise<void> {
    try {
      const review = await this.reviewRepository.findById(reviewId);

      if (!review) {
        throw new ServiceReviewNotFoundException(reviewId);
      }

      // Verify user is the reviewer
      if (review.reviewerUserId !== userId) {
        throw new ReviewDeleteForbiddenException();
      }

      await this.reviewRepository.delete(reviewId);
    } catch (error) {
      // Si ya es una RpcException, la relanzamos
      if (error instanceof RpcException) {
        throw error;
      }

      // Manejar error de FK constraint específicamente
      if (error.message && error.message.includes('foreign key constraint')) {
        throw new ReviewHasAssociatedReportsException();
      }

      // Error genérico
      throw new ServiceReviewInternalServerErrorException(error.message);
    }
  }
}
