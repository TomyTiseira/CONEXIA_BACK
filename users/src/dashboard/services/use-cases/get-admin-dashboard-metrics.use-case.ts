import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { User } from 'src/shared/entities/user.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import {
  ActiveUsersMetricsDto,
  AdminDashboardMetricsDto,
  NewUsersMetricsDto,
  ProjectsStatusMetricsDto,
  ServicesMetricsDto,
} from '../../dto/admin-dashboard-metrics.dto';

@Injectable()
export class GetAdminDashboardMetricsUseCase {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async execute(): Promise<AdminDashboardMetricsDto> {
    try {
      // Obtener métricas de usuarios
      const newUsers: NewUsersMetricsDto = await this.getNewUsersMetrics();
      const activeUsers: ActiveUsersMetricsDto =
        await this.getActiveUsersMetrics();

      // Obtener métricas de proyectos desde el microservicio de projects
      const projectsMetrics: ProjectsStatusMetricsDto =
        await this.getProjectsMetrics();

      // Obtener métricas de servicios desde el microservicio de services
      const servicesMetrics: ServicesMetricsDto =
        await this.getServicesMetrics();

      return {
        newUsers,
        activeUsers,
        projects: projectsMetrics,
        services: servicesMetrics,
      };
    } catch (error) {
      console.error('Error getting admin dashboard metrics:', error);
      throw error;
    }
  }

  private async getNewUsersMetrics() {
    const now = new Date();

    // Últimos 7 días
    const date7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = await this.userRepository.count({
      where: {
        createdAt: MoreThanOrEqual(date7DaysAgo),
      },
    });

    // Últimos 30 días
    const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30Days = await this.userRepository.count({
      where: {
        createdAt: MoreThanOrEqual(date30DaysAgo),
      },
    });

    // Últimos 90 días
    const date90DaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const last90Days = await this.userRepository.count({
      where: {
        createdAt: MoreThanOrEqual(date90DaysAgo),
      },
    });

    // Total de usuarios
    const total = await this.userRepository.count();

    return {
      last7Days,
      last30Days,
      last90Days,
      total,
    };
  }

  private async getActiveUsersMetrics() {
    const now = new Date();

    // Últimos 7 días - usuarios que han actualizado su información recientemente
    const date7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = await this.userRepository.count({
      where: {
        updatedAt: MoreThanOrEqual(date7DaysAgo),
      },
    });

    // Últimos 30 días
    const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30Days = await this.userRepository.count({
      where: {
        updatedAt: MoreThanOrEqual(date30DaysAgo),
      },
    });

    // Últimos 90 días
    const date90DaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const last90Days = await this.userRepository.count({
      where: {
        updatedAt: MoreThanOrEqual(date90DaysAgo),
      },
    });

    return {
      last7Days,
      last30Days,
      last90Days,
    };
  }

  private async getProjectsMetrics(): Promise<ProjectsStatusMetricsDto> {
    try {
      const response = await firstValueFrom(
        this.client.send<ProjectsStatusMetricsDto>(
          'getAdminProjectMetrics',
          {},
        ),
      );
      return response;
    } catch (error) {
      console.error('Error getting projects metrics:', error);
      return {
        totalProjects: 0,
        completedProjects: 0,
        activeProjects: 0,
        completionRate: 0,
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
      };
    }
  }
}
