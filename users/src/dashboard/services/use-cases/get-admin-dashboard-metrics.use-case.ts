import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { User } from 'src/shared/entities/user.entity';
import { UserVerification } from 'src/verification/entities/user-verification.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import {
  ActiveUsersMetricsDto,
  AdminDashboardMetricsDto,
  MembershipsMetricsDto,
  NewUsersMetricsDto,
  ProjectsMetricsDto,
  ReportsMetricsDto,
  ServicesMetricsDto,
  UsersMetricsDto,
  VerifiedUsersMetricsDto,
} from '../../dto/admin-dashboard-metrics.dto';

@Injectable()
export class GetAdminDashboardMetricsUseCase {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserVerification)
    private readonly verificationRepository: Repository<UserVerification>,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async execute(): Promise<AdminDashboardMetricsDto> {
    try {
      // Obtener métricas de usuarios
      const newUsers: NewUsersMetricsDto = await this.getNewUsersMetrics();
      const activeUsers: ActiveUsersMetricsDto =
        await this.getActiveUsersMetrics();
      const verifiedUsers: VerifiedUsersMetricsDto =
        await this.getVerifiedUsersMetrics();

      const usersMetrics: UsersMetricsDto = {
        newUsers,
        activeUsers,
        verifiedUsers,
      };

      // Obtener métricas de proyectos desde el microservicio de projects
      const projectsMetrics: ProjectsMetricsDto =
        await this.getProjectsMetrics();

      // Obtener métricas de servicios desde el microservicio de services
      const servicesMetrics: ServicesMetricsDto =
        await this.getServicesMetrics();

      // Obtener métricas de membresías
      const membershipsMetrics: MembershipsMetricsDto =
        await this.getMembershipsMetrics();

      // Obtener métricas de reportes
      const reportsMetrics: ReportsMetricsDto = await this.getReportsMetrics();

      return {
        users: usersMetrics,
        projects: projectsMetrics,
        services: servicesMetrics,
        memberships: membershipsMetrics,
        reports: reportsMetrics,
      };
    } catch (error) {
      console.error('Error getting admin dashboard metrics:', error);
      throw error;
    }
  }

  private async getNewUsersMetrics() {
    const now = new Date();
    const USER_ROLE_ID = 2; // roleId para usuarios generales (no admins ni moderadores)

    // Últimos 7 días
    const date7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = await this.userRepository.count({
      where: {
        createdAt: MoreThanOrEqual(date7DaysAgo),
        roleId: USER_ROLE_ID,
      },
    });

    // Últimos 30 días
    const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30Days = await this.userRepository.count({
      where: {
        createdAt: MoreThanOrEqual(date30DaysAgo),
        roleId: USER_ROLE_ID,
      },
    });

    // Últimos 90 días
    const date90DaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const last90Days = await this.userRepository.count({
      where: {
        createdAt: MoreThanOrEqual(date90DaysAgo),
        roleId: USER_ROLE_ID,
      },
    });

    // Total de usuarios generales
    const total = await this.userRepository.count({
      where: {
        roleId: USER_ROLE_ID,
      },
    });

    return {
      last7Days,
      last30Days,
      last90Days,
      total,
    };
  }

  private async getActiveUsersMetrics() {
    const now = new Date();
    const USER_ROLE_ID = 2; // roleId para usuarios generales (no admins ni moderadores)

    // Últimos 7 días - usuarios que han hecho login recientemente
    const date7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = await this.userRepository
      .createQueryBuilder('user')
      .where('user.roleId = :roleId', { roleId: USER_ROLE_ID })
      .andWhere('user.lastActivityAt >= :date', { date: date7DaysAgo })
      .getCount();

    // Últimos 30 días
    const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30Days = await this.userRepository
      .createQueryBuilder('user')
      .where('user.roleId = :roleId', { roleId: USER_ROLE_ID })
      .andWhere('user.lastActivityAt >= :date', { date: date30DaysAgo })
      .getCount();

    // Últimos 90 días
    const date90DaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const last90Days = await this.userRepository
      .createQueryBuilder('user')
      .where('user.roleId = :roleId', { roleId: USER_ROLE_ID })
      .andWhere('user.lastActivityAt >= :date', { date: date90DaysAgo })
      .getCount();

    return {
      last7Days,
      last30Days,
      last90Days,
    };
  }

  private async getVerifiedUsersMetrics(): Promise<VerifiedUsersMetricsDto> {
    const USER_ROLE_ID = 2; // roleId para usuarios generales (no admins ni moderadores)

    // Total de usuarios generales
    const totalUsers = await this.userRepository.count({
      where: {
        roleId: USER_ROLE_ID,
      },
    });

    // Obtener IDs de usuarios verificados (solo usuarios generales)
    const verifiedUsers = await this.verificationRepository
      .createQueryBuilder('verification')
      .innerJoin('users', 'user', 'user.id = verification.userId')
      .where('verification.matchResult = :matchResult', { matchResult: true })
      .andWhere('user.roleId = :roleId', { roleId: USER_ROLE_ID })
      .select('verification.userId', 'userId')
      .getRawMany();

    const verifiedUserIds = verifiedUsers.map((v) => v.userId);
    const verifiedCount = verifiedUserIds.length;

    // Usuarios verificados Y activos en los últimos 90 días (con lastActivityAt)
    const date90DaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    let verifiedAndActiveCount = 0;
    if (verifiedUserIds.length > 0) {
      verifiedAndActiveCount = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id IN (:...ids)', { ids: verifiedUserIds })
        .andWhere('user.roleId = :roleId', { roleId: USER_ROLE_ID })
        .andWhere('user.lastActivityAt >= :date', { date: date90DaysAgo })
        .getCount();
    }

    const verificationPercentage =
      totalUsers > 0 ? (verifiedCount / totalUsers) * 100 : 0;

    return {
      verified: verifiedCount,
      verifiedAndActive: verifiedAndActiveCount,
      total: totalUsers,
      verificationPercentage: Math.round(verificationPercentage * 100) / 100,
    };
  }

  private async getProjectsMetrics(): Promise<ProjectsMetricsDto> {
    try {
      const response = await firstValueFrom(
        this.client.send<ProjectsMetricsDto>('getAdminProjectMetrics', {}),
      );
      return response;
    } catch (error) {
      console.error('Error getting projects metrics:', error);
      return {
        totalProjects: 0,
        activeProjects: 0,
        projectsWithPostulations: 0,
        projectsWithAcceptedPostulation: 0,
        averagePostulationsPerProject: 0,
        projectEngagementRate: 0,
        newProjectsLast7Days: 0,
        newProjectsLast30Days: 0,
        newProjectsLast90Days: 0,
        projectsByCategory: [],
        postulationsByStatus: [],
        postulationApprovalRate: 0,
      };
    }
  }

  private async getServicesMetrics(): Promise<ServicesMetricsDto> {
    try {
      const response = await firstValueFrom(
        this.client.send<ServicesMetricsDto>('getAdminServiceMetrics', {}),
      );
      return response;
    } catch (error) {
      console.error('Error getting services metrics:', error);
      return {
        totalServicesHired: 0,
        totalRevenue: 0,
        byType: [],
        quotations: {
          sent: 0,
          accepted: 0,
          acceptanceRate: 0,
        },
        claims: {
          totalClaims: 0,
          resolvedClaims: 0,
          totalServicesHired: 0,
          claimRate: 0,
          resolutionRate: 0,
          averageResolutionTimeInHours: 0,
        },
      };
    }
  }

  private async getMembershipsMetrics(): Promise<MembershipsMetricsDto> {
    try {
      const response = await firstValueFrom(
        this.client.send<MembershipsMetricsDto>(
          'getAdminMembershipMetrics',
          {},
        ),
      );
      return response;
    } catch (error) {
      console.error('Error getting memberships metrics:', error);
      return {
        usersByPlan: [],
      };
    }
  }

  private async getReportsMetrics(): Promise<ReportsMetricsDto> {
    try {
      const response = await firstValueFrom(
        this.client.send<ReportsMetricsDto>('getAdminReportMetrics', {}),
      );
      return response;
    } catch (error) {
      console.error('Error getting reports metrics:', error);
      return {
        totalReports: 0,
        byStatus: [],
        byType: [],
        byReason: [],
      };
    }
  }
}
