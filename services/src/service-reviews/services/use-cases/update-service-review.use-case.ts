import { Injectable } from '@nestjs/common';
import {
  ReviewUpdateForbiddenException,
  ServiceReviewNotFoundException,
} from '../../../common/exceptions/service-review.exceptions';
import { UpdateServiceReviewDto } from '../../dto/update-service-review.dto';
import { ServiceReview } from '../../entities/service-review.entity';
import { ServiceReviewRepository } from '../../repositories/service-review.repository';

@Injectable()
export class UpdateServiceReviewUseCase {
  constructor(private readonly reviewRepository: ServiceReviewRepository) {}

  async execute(
    userId: number,
    reviewId: number,
    dto: UpdateServiceReviewDto,
  ): Promise<ServiceReview> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new ServiceReviewNotFoundException(reviewId);
    }

    // Verify user is the reviewer
    if (review.reviewerUserId !== userId) {
      throw new ReviewUpdateForbiddenException();
    }

    // Construir objeto de actualización solo con campos proporcionados
    const updateData: Partial<ServiceReview> = {};
    if (dto.rating !== undefined) {
      updateData.rating = dto.rating;
    }
    if (dto.comment !== undefined) {
      updateData.comment = dto.comment;
    }

    const updatedReview = await this.reviewRepository.update(
      reviewId,
      updateData,
    );

    return updatedReview!;
  }
}
