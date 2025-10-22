import { Injectable } from '@nestjs/common';
import {
  UserReviewDeleteForbiddenException,
  UserReviewNotFoundException,
} from '../../exceptions/user-review.exceptions';
import { UserReviewRepository } from '../../repository/user-review.repository';

@Injectable()
export class DeleteUserReviewUseCase {
  constructor(private readonly userReviewRepository: UserReviewRepository) {}

  async execute(id: number, userId: number) {
    const review = await this.userReviewRepository.findById(id);

    if (!review) {
      throw new UserReviewNotFoundException();
    }

    if (review.reviewerUserId !== userId) {
      throw new UserReviewDeleteForbiddenException();
    }

    await this.userReviewRepository.delete(id);
    return { message: 'Review deleted successfully' };
  }
}
