import { Injectable } from '@nestjs/common';
import {
    ReviewDeleteForbiddenException,
    ServiceReviewNotFoundException,
} from '../../../common/exceptions/service-review.exceptions';
import { ServiceReviewRepository } from '../../repositories/service-review.repository';

@Injectable()
export class DeleteServiceReviewUseCase {
  constructor(private readonly reviewRepository: ServiceReviewRepository) {}

  async execute(userId: number, reviewId: number): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new ServiceReviewNotFoundException(reviewId);
    }

    // Verify user is the reviewer
    if (review.reviewerUserId !== userId) {
      throw new ReviewDeleteForbiddenException();
    }

    await this.reviewRepository.delete(reviewId);
  }
}
