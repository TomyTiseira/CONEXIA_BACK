import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from '../../../config';
import { ModeratorDashboardMetricsDto } from '../../dto/moderator-dashboard-metrics.dto';
import { DashboardReportsService } from '../dashboard-reports.service';

@Injectable()
export class GetModeratorDashboardMetricsUseCase {
  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    private readonly reportsService: DashboardReportsService,
  ) {}

  async execute(): Promise<ModeratorDashboardMetricsDto> {
    try {
      // Obtener métricas de reportes (mismo servicio que admin)
      const reportsMetrics = await this.reportsService.getAdminReportMetrics();

      // Obtener métricas de claims desde services microservice
      const serviceMetrics = await this.getServiceClaimsMetrics();

      return {
        reports: reportsMetrics,
        claims: serviceMetrics,
      };
    } catch (error) {
      console.error('Error getting moderator dashboard metrics:', error);
      throw error;
    }
  }

  private async getServiceClaimsMetrics() {
    try {
      // Obtener todas las métricas de servicios y extraer solo claims
      const response = await firstValueFrom(
        this.client.send<any>('getAdminServiceMetrics', {}),
      );

      return {
        totalClaims: response.claims?.totalClaims || 0,
        resolvedClaims: response.claims?.resolvedClaims || 0,
        servicesInProgress: response.claims?.servicesInProgress || 0,
        totalServicesHired: response.claims?.totalServicesHired || 0,
        claimRate: response.claims?.claimRate || 0,
        resolutionRate: response.claims?.resolutionRate || 0,
        averageResolutionTimeInHours:
          response.claims?.averageResolutionTimeInHours || 0,
      };
    } catch (error) {
      console.error('Error getting service claims metrics:', error);
      return {
        totalClaims: 0,
        resolvedClaims: 0,
        servicesInProgress: 0,
        totalServicesHired: 0,
        claimRate: 0,
        resolutionRate: 0,
        averageResolutionTimeInHours: 0,
      };
    }
  }
}
