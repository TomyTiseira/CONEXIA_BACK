import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import {
  PostulationMetricsDto,
  ProjectMetricsDto,
  ServiceMetricsDto,
  UserDashboardMetricsDto,
} from '../../dto/user-dashboard-metrics.dto';

@Injectable()
export class GetUserDashboardMetricsUseCase {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async execute(userId: number): Promise<UserDashboardMetricsDto> {
    try {
      // Obtener métricas de servicios desde el microservicio de services
      const serviceMetrics: ServiceMetricsDto =
        await this.getServiceMetrics(userId);

      // Obtener métricas de proyectos desde el microservicio de projects
      const projectMetrics: ProjectMetricsDto =
        await this.getProjectMetrics(userId);

      // Obtener métricas de postulaciones desde el microservicio de projects
      const postulationMetrics: PostulationMetricsDto =
        await this.getPostulationMetrics(userId);

      return {
        services: serviceMetrics,
        projects: projectMetrics,
        postulations: postulationMetrics,
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
}
