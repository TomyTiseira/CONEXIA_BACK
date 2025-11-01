import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { ServiceReviewsModule } from '../service-reviews/service-reviews.module';
import { ServiceReviewReport } from './entities/service-review-report.entity';
import { ServiceReviewReportRepository } from './repositories/service-review-report.repository';
import { ServiceReviewReportsController } from './service-review-reports.controller';
import { ServiceReviewReportValidationService } from './services/service-review-report-validation.service';
import { CreateServiceReviewReportUseCase } from './services/use-cases/create-service-review-report.use-case';
import { GetServiceReviewReportsUseCase } from './services/use-cases/get-service-review-reports.use-case';
import { GetServiceReviewsWithReportsUseCase } from './services/use-cases/get-service-reviews-with-reports.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceReviewReport]),
    forwardRef(() => ServiceReviewsModule),
    CommonModule,
  ],
  controllers: [ServiceReviewReportsController],
  providers: [
    ServiceReviewReportRepository,
    ServiceReviewReportValidationService,
    CreateServiceReviewReportUseCase,
    GetServiceReviewReportsUseCase,
    GetServiceReviewsWithReportsUseCase,
  ],
  exports: [ServiceReviewReportRepository],
})
export class ServiceReviewReportsModule {}
