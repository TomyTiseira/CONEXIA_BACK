import { Injectable } from '@nestjs/common';
import { UpdateUserReviewDto } from '../../dto/update-user-review.dto';
import {
  UserReviewForbiddenException,
  UserReviewNotFoundAfterUpdateException,
  UserReviewNotFoundException,
} from '../../exceptions/user-review.exceptions';
import { UserReviewRepository } from '../../repository/user-review.repository';

@Injectable()
export class UpdateUserReviewUseCase {
  constructor(private readonly userReviewRepository: UserReviewRepository) {}

  async execute(
    id: number,
    updateUserReviewDto: UpdateUserReviewDto,
    userId: number,
  ) {
    const review = await this.userReviewRepository.findById(id);

    if (!review) {
      throw new UserReviewNotFoundException();
    }

    if (review.reviewerUserId !== userId) {
      throw new UserReviewForbiddenException();
    }

    const updatedReview = await this.userReviewRepository.update(
      id,
      updateUserReviewDto,
    );

    if (!updatedReview) {
      throw new UserReviewNotFoundAfterUpdateException();
    }

    return updatedReview;
  }
}
