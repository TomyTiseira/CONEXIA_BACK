import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserReviewDto } from '../dto/create-user-review.dto';
import { GetUserReviewsDto } from '../dto/get-user-reviews.dto';
import { UserReviewsService } from '../service/user-reviews.service';

@Controller('user-reviews')
export class UserReviewsController {
  constructor(private readonly userReviewsService: UserReviewsService) {}

  @MessagePattern('create_user_review')
  async createUserReview(@Payload() createUserReviewDto: CreateUserReviewDto) {
    return await this.userReviewsService.createUserReview(createUserReviewDto);
  }

  @MessagePattern('get_user_reviews')
  async getUserReviews(@Payload() getUserReviewsDto: GetUserReviewsDto) {
    return await this.userReviewsService.getUserReviews(getUserReviewsDto);
  }
}
