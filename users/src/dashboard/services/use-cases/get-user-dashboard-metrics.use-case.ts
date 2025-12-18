/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import {
  PostulationMetricsDto,
  ProjectDashboardMetricsDto,
  ProjectMetricsDto,
  ServiceMetricsDto,
  UserDashboardMetricsDto,
} from '../../dto/user-dashboard-metrics.dto';

@Injectable()
export class GetUserDashboardMetricsUseCase {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async execute(userId: number): Promise<UserDashboardMetricsDto> {
    try {
      // Obtener plan del usuario para las métricas del dashboard de proyectos
      const userPlan = await this.getUserPlan(userId);

      // Obtener métricas de servicios desde el microservicio de services
      const serviceMetrics: ServiceMetricsDto =
        await this.getServiceMetrics(userId);

      // Obtener métricas de proyectos desde el microservicio de projects
      const projectMetrics: ProjectMetricsDto =
        await this.getProjectMetrics(userId);

      // Obtener métricas de postulaciones desde el microservicio de projects
      const postulationMetrics: PostulationMetricsDto =
        await this.getPostulationMetrics(userId);

      // Obtener métricas del dashboard de proyectos (con filtros según el plan)
      const projectDashboardMetrics: ProjectDashboardMetricsDto =
        await this.getProjectDashboardMetrics(userId, userPlan);

      return {
        services: serviceMetrics,
        projects: projectMetrics,
        postulations: postulationMetrics,
        projectDashboard: projectDashboardMetrics,
      };
    } catch (error) {
      console.error('Error getting user dashboard metrics:', error);
      throw error;
    }
  }

  private async getServiceMetrics(userId: number): Promise<ServiceMetricsDto> {
    try {
      const response = await firstValueFrom(
        this.client.send<ServiceMetricsDto>('getUserServiceMetrics', {
          userId,
        }),
      );
      return response;
    } catch (error) {
      console.error('Error getting service metrics:', error);
      return {
        totalServicesHired: 0,
        totalRevenueGenerated: 0,
      };
    }
  }

  private async getProjectMetrics(userId: number): Promise<ProjectMetricsDto> {
    try {
      const response = await firstValueFrom(
        this.client.send<ProjectMetricsDto>('getUserProjectMetrics', {
          userId,
        }),
      );
      return response;
    } catch (error) {
      console.error('Error getting project metrics:', error);
      return {
        totalProjectsEstablished: 0,
      };
    }
  }

  private async getPostulationMetrics(
    userId: number,
  ): Promise<PostulationMetricsDto> {
    try {
      const response = await firstValueFrom(
        this.client.send<PostulationMetricsDto>('getUserPostulationMetrics', {
          userId,
        }),
      );
      return response;
    } catch (error) {
      console.error('Error getting postulation metrics:', error);
      return {
        totalPostulations: 0,
        acceptedPostulations: 0,
        successRate: 0,
      };
    }
  }

  private async getUserPlan(
    userId: number,
  ): Promise<{ name: string; isFreePlan: boolean }> {
    try {
      const response = await firstValueFrom(
        this.client.send('getUserPlan', { userId }),
      );
      return {
        name: response?.plan?.name || 'Free',
        isFreePlan: response?.isFreePlan ?? true,
      };
    } catch (error) {
      console.error('Error getting user plan:', error);
      return {
        name: 'Free',
        isFreePlan: true,
      };
    }
  }

  private async getProjectDashboardMetrics(
    userId: number,
    userPlan: { name: string; isFreePlan: boolean },
  ): Promise<ProjectDashboardMetricsDto> {
    try {
      const response = await firstValueFrom(
        this.client.send<ProjectDashboardMetricsDto>(
          'getProjectDashboardMetrics',
          { userId, userPlan },
        ),
      );
      return response;
    } catch (error) {
      console.error('Error getting project dashboard metrics:', error);
      return {};
    }
  }
}
