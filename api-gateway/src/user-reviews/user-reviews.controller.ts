import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { NATS_SERVICE } from 'src/config';
import { AuthenticatedUser } from 'src/users/interfaces/user.interfaces';
import { CreateUserReviewDto } from './dto/create-user-review.dto';
import { GetUserReviewsDto } from './dto/get-user-reviews.dto';

@Controller('user-reviews')
export class UserReviewsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  @AuthRoles([ROLES.USER])
  createUserReview(
    @Body() createUserReviewDto: CreateUserReviewDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      ...createUserReviewDto,
      reviewerUserId: user.id,
    };

    return this.client.send('create_user_review', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get(':userId')
  @AuthRoles([ROLES.USER])
  getUserReviews(
    @Param('userId') userId: string,
    @Query() getUserReviewsDto: GetUserReviewsDto,
  ) {
    const payload = {
      userId: parseInt(userId),
      ...getUserReviewsDto,
    };

    return this.client.send('get_user_reviews', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
