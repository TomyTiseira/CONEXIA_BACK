import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  ReviewDeleteForbiddenException,
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
        throw new RpcException({
          status: 409,
          message: 'Cannot delete review because it has associated reports. Please contact support.',
          error: 'Foreign Key Constraint Violation',
        });
      }

      // Error genérico
      throw new RpcException({
        status: 500,
        message: 'An error occurred while deleting the review',
        error: 'Internal Server Error',
      });
    }
  }
}
