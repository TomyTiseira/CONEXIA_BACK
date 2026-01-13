import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DashboardService } from '../services/dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @MessagePattern('getUserDashboardMetrics')
  getUserMetrics(@Payload() data: { userId: number }) {
    return this.dashboardService.getUserMetrics(data.userId);
  }

  @MessagePattern('getAdminDashboardMetrics')
  getAdminMetrics() {
    return this.dashboardService.getAdminMetrics();
  }

  @MessagePattern('getModeratorDashboardMetrics')
  getModeratorMetrics() {
    return this.dashboardService.getModeratorMetrics();
  }
}
