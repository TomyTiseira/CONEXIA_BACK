import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../../users/users.module';
import { UserReviewReportsController } from './controllers/user-review-reports.controller';
import { UserReviewReport } from './entities/user-review-report.entity';
import { UserReviewReportRepository } from './repositories/user-review-report.repository';
import { UserReviewRepository } from './repository/user-review.repository';
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
    TypeOrmModule.forFeature([UserReviewReport]),
    forwardRef(() => UsersModule),
  ],
  exports: [UserReviewReportsService],
})
export class UserReviewReportsModule {}
