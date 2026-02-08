import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DashboardReportsService } from '../services/dashboard-reports.service';

@Controller()
export class DashboardReportsController {
  constructor(
    private readonly dashboardReportsService: DashboardReportsService,
  ) {}

  @MessagePattern('getAdminReportMetrics')
  async getAdminReportMetrics() {
    return this.dashboardReportsService.getAdminReportMetrics();
  }
}
