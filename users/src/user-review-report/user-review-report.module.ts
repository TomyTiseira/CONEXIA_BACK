import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserReview } from '../shared/entities/user-review.entity';
import { UserReviewRepository } from '../user-reviews/repository/user-review.repository';
import { UsersModule } from '../users/users.module';
import { UserReviewReportsController } from './controller/user-review-reports.controller';
import { UserReviewReport } from './entities/user-review-report.entity';
import { UserReviewReportRepository } from './repositories/user-review-report.repository';
import { GetUserReviewReportsUseCase } from './services/use-cases/get-user-review-reports.use-case';
import { GetUserReviewsWithReportsUseCase } from './services/use-cases/get-user-reviews-with-reports.use-case';
import { UserReviewReportValidationService } from './services/user-review-report-validation.service';
import { UserReviewReportsService } from './services/user-review-reports.service';

@Module({
  controllers: [UserReviewReportsController],
  providers: [
    UserReviewReportsService,
    UserReviewReportValidationService,
    UserReviewReportRepository,
    UserReviewRepository,
    GetUserReviewsWithReportsUseCase,
    GetUserReviewReportsUseCase,
  ],
  imports: [
    TypeOrmModule.forFeature([UserReviewReport, UserReview]),
    forwardRef(() => UsersModule),
  ],
  exports: [UserReviewReportsService, UserReviewReportRepository],
})
export class UserReviewReportModule {}
