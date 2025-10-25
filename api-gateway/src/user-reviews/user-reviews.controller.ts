import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { NATS_SERVICE } from 'src/config';
import { AuthenticatedUser } from 'src/users/interfaces/user.interfaces';
import { CreateUserReviewReportDto } from './dto/create-user-review-report.dto';
import { CreateUserReviewDto } from './dto/create-user-review.dto';
import { GetUserReviewReportsDto } from './dto/get-user-review-reports.dto';
import { GetUserReviewsDto } from './dto/get-user-reviews.dto';
import { UpdateUserReviewDto } from './dto/update-user-review.dto';

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
        throw error;
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
        throw error;
      }),
    );
  }

  @Patch(':id')
  @AuthRoles([ROLES.USER])
  updateUserReview(
    @Param('id') id: string,
    @Body() updateUserReviewDto: UpdateUserReviewDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      id: parseInt(id),
      updateUserReviewDto,
      userId: user.id,
    };

    return this.client.send('update_user_review', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  @Delete(':id')
  @AuthRoles([ROLES.USER])
  deleteUserReview(@Param('id') id: string, @User() user: AuthenticatedUser) {
    const payload = {
      id: parseInt(id),
      userId: user.id,
    };

    return this.client.send('delete_user_review', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  @Post('reports')
  @AuthRoles([ROLES.USER])
  createUserReviewReport(
    @Body() createUserReviewReportDto: CreateUserReviewReportDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('createUserReviewReport', {
        createUserReviewReportDto,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw error;
        }),
      );
  }

  @Get('reports/:userReviewId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getUserReviewReports(
    @Param('userReviewId') userReviewId: string,
    @Query() query: GetUserReviewReportsDto,
  ) {
    return this.client
      .send('getUserReviewReports', {
        userReviewId: parseInt(userReviewId, 10),
        page: query.page || 1,
        limit: query.limit || 10,
      })
      .pipe(
        catchError((error) => {
          throw error;
        }),
      );
  }

  @Get('reports')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getUserReviewsWithReports(@Query() query: GetUserReviewReportsDto) {
    return this.client
      .send('getUserReviewsWithReports', {
        page: query.page || 1,
        limit: query.limit || 10,
        orderBy: 'reportCount',
      })
      .pipe(
        catchError((error) => {
          throw error;
        }),
      );
  }
}
