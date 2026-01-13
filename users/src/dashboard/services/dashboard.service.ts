import { Injectable } from '@nestjs/common';
import { AdminDashboardMetricsDto } from '../dto/admin-dashboard-metrics.dto';
import { ModeratorDashboardMetricsDto } from '../dto/moderator-dashboard-metrics.dto';
import { UserDashboardMetricsDto } from '../dto/user-dashboard-metrics.dto';
import { GetAdminDashboardMetricsUseCase } from './use-cases/get-admin-dashboard-metrics.use-case';
import { GetModeratorDashboardMetricsUseCase } from './use-cases/get-moderator-dashboard-metrics.use-case';
import { GetUserDashboardMetricsUseCase } from './use-cases/get-user-dashboard-metrics.use-case';

@Injectable()
export class DashboardService {
  constructor(
    private readonly getUserDashboardMetricsUC: GetUserDashboardMetricsUseCase,
    private readonly getAdminDashboardMetricsUC: GetAdminDashboardMetricsUseCase,
    private readonly getModeratorDashboardMetricsUC: GetModeratorDashboardMetricsUseCase,
  ) {}

  async getUserMetrics(userId: number): Promise<UserDashboardMetricsDto> {
    return this.getUserDashboardMetricsUC.execute(userId);
  }

  async getAdminMetrics(): Promise<AdminDashboardMetricsDto> {
    return this.getAdminDashboardMetricsUC.execute();
  }

  async getModeratorMetrics(): Promise<ModeratorDashboardMetricsDto> {
    return this.getModeratorDashboardMetricsUC.execute();
  }
}
