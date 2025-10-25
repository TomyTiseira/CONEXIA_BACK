import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserReviewReportDto } from '../dtos/create-user-review-report.dto';
import {
    GetUserReviewReportsListDto,
    OrderByUserReviewReport,
} from '../dtos/get-user-review-reports-list.dto';
import { GetUserReviewReportsDto } from '../dtos/get-user-review-reports.dto';
import { GetUserReviewReportsUseCase } from '../services/use-cases/get-user-review-reports.use-case';
import { GetUserReviewsWithReportsUseCase } from '../services/use-cases/get-user-reviews-with-reports.use-case';
import { UserReviewReportsService } from '../services/user-review-reports.service';

@Controller()
export class UserReviewReportsController {
  constructor(
    private readonly userReviewReportsService: UserReviewReportsService,
    private readonly getUserReviewsWithReportsUseCase: GetUserReviewsWithReportsUseCase,
    private readonly getUserReviewReportsUseCase: GetUserReviewReportsUseCase,
  ) {}

  @MessagePattern('createUserReviewReport')
  async createUserReviewReport(
    @Payload()
    data: {
      createUserReviewReportDto: CreateUserReviewReportDto;
      userId: number;
    },
  ) {
    const report = await this.userReviewReportsService.createReport(
      data.createUserReviewReportDto,
      data.userId,
    );
    return {
      report,
    };
  }

  @MessagePattern('getUserReviewReports')
  async getUserReviewReports(
    @Payload() getUserReviewReportsDto: GetUserReviewReportsDto,
  ) {
    return await this.getUserReviewReportsUseCase.execute(
      getUserReviewReportsDto,
    );
  }

  @MessagePattern('getUserReviewsWithReports')
  async getUserReviewsWithReports(
    @Payload()
    data: {
      page: number;
      limit: number;
      orderBy: OrderByUserReviewReport;
    },
  ) {
    const getUserReviewReportsListDto: GetUserReviewReportsListDto = {
      page: data.page,
      limit: data.limit,
      orderBy: data.orderBy,
    };

    return await this.getUserReviewsWithReportsUseCase.execute(
      getUserReviewReportsListDto,
    );
  }

  @MessagePattern('getActiveUserReviewReports')
  async getActiveUserReviewReports() {
    return await this.userReviewReportsService.getActiveReports();
  }

  @MessagePattern('softDeleteOldUserReviewReports')
  async softDeleteOldUserReviewReports(@Payload() data: { oneYearAgo: Date }) {
    return await this.userReviewReportsService.softDeleteOldReports(
      data.oneYearAgo,
    );
  }

  @MessagePattern('deactivateUserReviewReports')
  async deactivateUserReviewReports(@Payload() data: { reportIds: number[] }) {
    return await this.userReviewReportsService.deactivateReports(
      data.reportIds,
    );
  }
}
