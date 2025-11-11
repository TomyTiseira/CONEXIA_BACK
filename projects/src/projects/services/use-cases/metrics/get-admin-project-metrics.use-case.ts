import { Injectable } from '@nestjs/common';
import { ProjectRepository } from '../../../repositories/project.repository';

export interface AdminProjectMetrics {
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  completionRate: number;
}

@Injectable()
export class GetAdminProjectMetricsUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(): Promise<AdminProjectMetrics> {
    try {
      // Obtener total de proyectos
      const totalProjects = await this.projectRepository.getTotalCount();

      // Obtener proyectos completados
      const completedProjects =
        await this.projectRepository.getCompletedCount();

      // Obtener proyectos activos (no eliminados y con fecha de fin futura o sin fecha)
      const activeProjects = await this.projectRepository.getActiveCount();

      // Calcular tasa de finalización
      const completionRate =
        totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

      return {
        totalProjects,
        completedProjects,
        activeProjects,
        completionRate: Math.round(completionRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting admin project metrics:', error);
      return {
        totalProjects: 0,
        completedProjects: 0,
        activeProjects: 0,
        completionRate: 0,
      };
    }
  }
}
