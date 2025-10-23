import { Injectable } from '@nestjs/common';
import { CreateUserReviewDto } from '../dto/create-user-review.dto';
import { GetUserReviewsDto } from '../dto/get-user-reviews.dto';
import { UpdateUserReviewDto } from '../dto/update-user-review.dto';
import { CreateUserReviewUseCase } from './use-cases/create-user-review.use-case';
import { DeleteUserReviewUseCase } from './use-cases/delete-user-review.use-case';
import { GetUserReviewsUseCase } from './use-cases/get-user-reviews.use-case';
import { UpdateUserReviewUseCase } from './use-cases/update-user-review.use-case';

@Injectable()
export class UserReviewsService {
  constructor(
    private readonly createUserReviewUseCase: CreateUserReviewUseCase,
    private readonly getUserReviewsUseCase: GetUserReviewsUseCase,
    private readonly updateUserReviewUseCase: UpdateUserReviewUseCase,
    private readonly deleteUserReviewUseCase: DeleteUserReviewUseCase,
  ) {}

  async createUserReview(createUserReviewDto: CreateUserReviewDto) {
    return await this.createUserReviewUseCase.execute(createUserReviewDto);
  }

  async getUserReviews(getUserReviewsDto: GetUserReviewsDto) {
    return await this.getUserReviewsUseCase.execute(getUserReviewsDto);
  }

  async updateUserReview(
    id: number,
    updateUserReviewDto: UpdateUserReviewDto,
    userId: number,
  ) {
    return await this.updateUserReviewUseCase.execute(
      id,
      updateUserReviewDto,
      userId,
    );
  }

  async deleteUserReview(id: number, userId: number) {
    return await this.deleteUserReviewUseCase.execute(id, userId);
  }
}
