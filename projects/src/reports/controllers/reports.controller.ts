import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateReportDto } from '../dtos/create-report.dto';
import { GetProjectReportsDto } from '../dtos/get-project-reports.dto';
import { GetReportsDto } from '../dtos/get-reports.dto';
import { OrderByReport } from '../enum/orderby-report.enum';
import { ReportsService } from '../services/reports.service';
import { GetProjectReportsUseCase } from '../services/use-cases/get-project-reports.use-case';
import { GetProjectsWithReportsUseCase } from '../services/use-cases/get-projects-with-reports.use-case';

@Controller()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly getProjectsWithReportsUseCase: GetProjectsWithReportsUseCase,
    private readonly getProjectReportsUseCase: GetProjectReportsUseCase,
  ) {}

  @MessagePattern('createProjectReport')
  async createProjectReport(
    @Payload() data: { createReportDto: CreateReportDto; userId: number },
  ) {
    const report = await this.reportsService.createReport(
      data.createReportDto,
      data.userId,
    );
    return {
      report,
    };
  }

  @MessagePattern('getProjectReports')
  async getProjectReports(
    @Payload() getProjectReportsDto: GetProjectReportsDto,
  ) {
    return await this.getProjectReportsUseCase.execute(getProjectReportsDto);
  }

  @MessagePattern('getProjectsWithReports')
  async getProjectsWithReports(
    @Payload()
    data: {
      page: number;
      limit: number;
      orderBy: OrderByReport;
    },
  ) {
    const getReportsDto: GetReportsDto = {
      page: data.page,
      limit: data.limit,
      orderBy: data.orderBy,
    };

    return await this.getProjectsWithReportsUseCase.execute(getReportsDto);
  }

  @MessagePattern('getActiveProjectReports')
  async getActiveProjectReports() {
    return await this.reportsService.getActiveReports();
  }

  @MessagePattern('softDeleteOldProjectReports')
  async softDeleteOldProjectReports(@Payload() data: { oneYearAgo: Date }) {
    return await this.reportsService.softDeleteOldReports(data.oneYearAgo);
  }

  @MessagePattern('deactivateProjectReports')
  async deactivateProjectReports(@Payload() data: { reportIds: number[] }) {
    return await this.reportsService.deactivateReports(data.reportIds);
  }
}
