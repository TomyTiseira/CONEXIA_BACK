import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ServiceReviewRepository } from '../../repositories/service-review.repository';

@Injectable()
export class DeleteServiceReviewUseCase {
  constructor(private readonly reviewRepository: ServiceReviewRepository) {}

  async execute(userId: number, reviewId: number): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Verify user is the reviewer
    if (review.reviewerUserId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepository.delete(reviewId);
  }
}
