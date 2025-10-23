import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateServiceReportDto } from '../dtos/create-service-report.dto';
import {
  GetServiceReportsListDto,
  OrderByServiceReport,
} from '../dtos/get-service-reports-list.dto';
import { GetServiceReportsDto } from '../dtos/get-service-reports.dto';
import { ServiceReportsService } from '../services/service-reports.service';
import { GetServiceReportsUseCase } from '../services/use-cases/get-service-reports.use-case';
import { GetServicesWithReportsUseCase } from '../services/use-cases/get-services-with-reports.use-case';

@Controller()
export class ServiceReportsController {
  constructor(
    private readonly serviceReportsService: ServiceReportsService,
    private readonly getServicesWithReportsUseCase: GetServicesWithReportsUseCase,
    private readonly getServiceReportsUseCase: GetServiceReportsUseCase,
  ) {}

  @MessagePattern('createServiceReport')
  async createServiceReport(
    @Payload()
    data: {
      createServiceReportDto: CreateServiceReportDto;
      userId: number;
    },
  ) {
    const report = await this.serviceReportsService.createReport(
      data.createServiceReportDto,
      data.userId,
    );
    return {
      report,
    };
  }

  @MessagePattern('getServiceReports')
  async getServiceReports(
    @Payload() getServiceReportsDto: GetServiceReportsDto,
  ) {
    return await this.getServiceReportsUseCase.execute(getServiceReportsDto);
  }

  @MessagePattern('getServicesWithReports')
  async getServicesWithReports(
    @Payload()
    data: {
      page: number;
      limit: number;
      orderBy: OrderByServiceReport;
    },
  ) {
    const getServiceReportsListDto: GetServiceReportsListDto = {
      page: data.page,
      limit: data.limit,
      orderBy: data.orderBy,
    };

    return await this.getServicesWithReportsUseCase.execute(
      getServiceReportsListDto,
    );
  }

  @MessagePattern('getActiveServiceReports')
  async getActiveServiceReports() {
    return await this.serviceReportsService.getActiveReports();
  }

  @MessagePattern('softDeleteOldServiceReports')
  async softDeleteOldServiceReports(@Payload() data: { oneYearAgo: Date }) {
    return await this.serviceReportsService.softDeleteOldReports(
      data.oneYearAgo,
    );
  }

  @MessagePattern('deactivateServiceReports')
  async deactivateServiceReports(@Payload() data: { reportIds: number[] }) {
    return await this.serviceReportsService.deactivateReports(data.reportIds);
  }
}
