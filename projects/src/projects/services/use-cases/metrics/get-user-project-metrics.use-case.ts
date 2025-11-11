import { Injectable } from '@nestjs/common';
import { ProjectRepository } from '../../../repositories/project.repository';

export interface UserProjectMetrics {
  totalProjectsEstablished: number;
}

@Injectable()
export class GetUserProjectMetricsUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(userId: number): Promise<UserProjectMetrics> {
    try {
      // Obtener proyectos completados del usuario que tuvieron al menos un colaborador
      const completedProjects =
        await this.projectRepository.findCompletedProjectsByUserId(userId);

      return {
        totalProjectsEstablished: completedProjects.length,
      };
    } catch (error) {
      console.error('Error getting user project metrics:', error);
      return {
        totalProjectsEstablished: 0,
      };
    }
  }
}
