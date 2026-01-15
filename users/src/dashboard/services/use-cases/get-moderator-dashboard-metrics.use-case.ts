import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { NATS_SERVICE } from '../../../config';
import { AccountStatus, User } from '../../../shared/entities/user.entity';
import { ModeratorDashboardMetricsDto, UserModerationMetricsDto } from '../../dto/moderator-dashboard-metrics.dto';
import { DashboardReportsService } from '../dashboard-reports.service';

type ServiceClaimsMetrics = {
  totalClaims: number;
  resolvedClaims: number;
  servicesInProgress: number;
  totalServicesHired: number;
  claimRate: number;
  resolutionRate: number;
  averageResolutionTimeInHours: number;
};

type AdminServiceMetricsResponse = {
  claims?: Partial<ServiceClaimsMetrics>;
};

@Injectable()
export class GetModeratorDashboardMetricsUseCase {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    private readonly reportsService: DashboardReportsService,
  ) {}

  async execute(): Promise<ModeratorDashboardMetricsDto> {
    try {
      // Obtener métricas de moderación de usuarios
      const userModeration = await this.getUserModerationMetrics();

      // Obtener métricas de reportes (mismo servicio que admin)
      const reportsMetrics = await this.reportsService.getAdminReportMetrics();

      // Obtener métricas de claims desde services microservice
      const serviceMetrics = await this.getServiceClaimsMetrics();

      return {
        userModeration,
        reports: reportsMetrics,
        claims: serviceMetrics,
      };
    } catch (error) {
      console.error('Error getting moderator dashboard metrics:', error);
      throw error;
    }
  }

  private async getServiceClaimsMetrics(): Promise<ServiceClaimsMetrics> {
    try {
      // Obtener todas las métricas de servicios y extraer solo claims
      const response = await firstValueFrom(
        this.client.send<AdminServiceMetricsResponse>(
          'getAdminServiceMetrics',
          {},
        ),
      );

      return {
        totalClaims: response.claims?.totalClaims ?? 0,
        resolvedClaims: response.claims?.resolvedClaims ?? 0,
        servicesInProgress: response.claims?.servicesInProgress ?? 0,
        totalServicesHired: response.claims?.totalServicesHired ?? 0,
        claimRate: response.claims?.claimRate ?? 0,
        resolutionRate: response.claims?.resolutionRate ?? 0,
        averageResolutionTimeInHours:
          response.claims?.averageResolutionTimeInHours ?? 0,
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

  private async getUserModerationMetrics(): Promise<UserModerationMetricsDto> {
    const USER_ROLE_ID = 2;

    // Total de usuarios
    const totalUsers = await this.userRepository.count({
      where: {
        roleId: USER_ROLE_ID,
      },
    });

    // Usuarios suspendidos
    const suspendedUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.roleId = :roleId', { roleId: USER_ROLE_ID })
      .andWhere('user.accountStatus = :status', { status: AccountStatus.SUSPENDED })
      .getCount();

    // Usuarios baneados
    const bannedUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.roleId = :roleId', { roleId: USER_ROLE_ID })
      .andWhere('user.accountStatus = :status', { status: AccountStatus.BANNED })
      .getCount();

    // Usuarios activos (sin sanciones)
    const activeUsers = totalUsers - suspendedUsers - bannedUsers;

    return {
      suspendedUsers,
      bannedUsers,
      totalUsers,
      activeUsers,
    };
  }
}
