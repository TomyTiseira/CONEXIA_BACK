import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { RespondServiceReviewDto } from '../../dto/respond-service-review.dto';
import { ServiceReview } from '../../entities/service-review.entity';
import { ServiceReviewRepository } from '../../repositories/service-review.repository';

@Injectable()
export class RespondToServiceReviewUseCase {
  constructor(private readonly reviewRepository: ServiceReviewRepository) {}

  async execute(
    userId: number,
    reviewId: number,
    dto: RespondServiceReviewDto,
  ): Promise<ServiceReview> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Verify user is the service owner
    if (review.serviceOwnerUserId !== userId) {
      throw new ForbiddenException(
        'Only the service owner can respond to this review',
      );
    }

    // Verify no existing response
    if (review.ownerResponse) {
      throw new BadRequestException('A response already exists for this review');
    }

    const updatedReview = await this.reviewRepository.update(reviewId, {
      ownerResponse: dto.ownerResponse,
      ownerResponseDate: new Date(),
    });

    return updatedReview!;
  }
}
