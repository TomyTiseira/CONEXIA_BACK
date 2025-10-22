import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserReviewDto } from '../dto/create-user-review.dto';
import { GetUserReviewsDto } from '../dto/get-user-reviews.dto';
import { UpdateUserReviewDto } from '../dto/update-user-review.dto';
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

  @MessagePattern('update_user_review')
  async updateUserReview(
    @Payload()
    payload: {
      id: number;
      updateUserReviewDto: UpdateUserReviewDto;
      userId: number;
    },
  ) {
    return await this.userReviewsService.updateUserReview(
      payload.id,
      payload.updateUserReviewDto,
      payload.userId,
    );
  }

  @MessagePattern('delete_user_review')
  async deleteUserReview(@Payload() payload: { id: number; userId: number }) {
    return await this.userReviewsService.deleteUserReview(
      payload.id,
      payload.userId,
    );
  }
}
