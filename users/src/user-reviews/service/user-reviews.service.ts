import { Injectable } from '@nestjs/common';
import { CreateUserReviewDto } from '../dto/create-user-review.dto';
import { GetUserReviewsDto } from '../dto/get-user-reviews.dto';
import { CreateUserReviewUseCase } from './use-cases/create-user-review.use-case';
import { GetUserReviewsUseCase } from './use-cases/get-user-reviews.use-case';

@Injectable()
export class UserReviewsService {
  constructor(
    private readonly createUserReviewUseCase: CreateUserReviewUseCase,
    private readonly getUserReviewsUseCase: GetUserReviewsUseCase,
  ) {}

  async createUserReview(createUserReviewDto: CreateUserReviewDto) {
    return await this.createUserReviewUseCase.execute(createUserReviewDto);
  }

  async getUserReviews(getUserReviewsDto: GetUserReviewsDto) {
    return await this.getUserReviewsUseCase.execute(getUserReviewsDto);
  }
}
