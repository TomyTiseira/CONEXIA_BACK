import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
    CreateServiceReviewReportDto,
    GetServiceReviewReportsDto,
    GetServiceReviewsWithReportsDto,
} from './dto';
import { OrderByServiceReviewReport } from './enums/orderby-service-review-report.enum';
import { CreateServiceReviewReportUseCase } from './services/use-cases/create-service-review-report.use-case';
import { GetServiceReviewReportsUseCase } from './services/use-cases/get-service-review-reports.use-case';
import { GetServiceReviewsWithReportsUseCase } from './services/use-cases/get-service-reviews-with-reports.use-case';

@Controller()
export class ServiceReviewReportsController {
  constructor(
    private readonly createReportUseCase: CreateServiceReviewReportUseCase,
    private readonly getReportsUseCase: GetServiceReviewReportsUseCase,
    private readonly getReviewsWithReportsUseCase: GetServiceReviewsWithReportsUseCase,
  ) {}

  @MessagePattern('create_service_review_report')
  async createReport(
    @Payload() payload: { userId: number; dto: CreateServiceReviewReportDto },
  ) {
    return await this.createReportUseCase.execute(
      payload.userId,
      payload.dto,
    );
  }

  @MessagePattern('get_service_review_reports')
  async getServiceReviewReports(@Payload() dto: GetServiceReviewReportsDto) {
    return await this.getReportsUseCase.execute(dto);
  }

  @MessagePattern('get_service_reviews_with_reports')
  async getServiceReviewsWithReports(
    @Payload()
    data: {
      page: number;
      limit: number;
      orderBy: OrderByServiceReviewReport;
    },
  ) {
    const dto: GetServiceReviewsWithReportsDto = {
      page: data.page,
      limit: data.limit,
      orderBy: data.orderBy,
    };

    return await this.getReviewsWithReportsUseCase.execute(dto);
  }
}
