import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserReview } from 'src/shared/entities/user-review.entity';
import { User } from 'src/shared/entities/user.entity';
import { UserReviewReport } from 'src/user-review-report/entities/user-review-report.entity';
import { UserReviewReportRepository } from 'src/user-review-report/repositories/user-review-report.repository';
import { UsersModule } from 'src/users/users.module';
import { UserReviewsController } from './controller/user-reviews.controller';
import { UserReviewRepository } from './repository/user-review.repository';
import { CreateUserReviewUseCase } from './service/use-cases/create-user-review.use-case';
import { DeleteUserReviewUseCase } from './service/use-cases/delete-user-review.use-case';
import { GetUserReviewsUseCase } from './service/use-cases/get-user-reviews.use-case';
import { UpdateUserReviewUseCase } from './service/use-cases/update-user-review.use-case';
import { UserReviewsService } from './service/user-reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserReview, User, UserReviewReport]),
    UsersModule,
  ],
  controllers: [UserReviewsController],
  providers: [
    UserReviewsService,
    UserReviewRepository,
    UserReviewReportRepository,
    CreateUserReviewUseCase,
    GetUserReviewsUseCase,
    UpdateUserReviewUseCase,
    DeleteUserReviewUseCase,
  ],
  exports: [UserReviewsService, UserReviewRepository],
})
export class UserReviewsModule {}
