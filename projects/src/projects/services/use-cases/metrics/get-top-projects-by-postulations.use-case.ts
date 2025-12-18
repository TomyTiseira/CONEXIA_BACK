import { Injectable } from '@nestjs/common';
import { PostulationRepository } from '../../../../postulations/repositories/postulation.repository';
import { ProjectWithPostulationsRankingDto } from '../../../dtos/project-dashboard-metrics.dto';
import { ProjectRepository } from '../../../repositories/project.repository';

@Injectable()
export class GetTopProjectsByPostulationsUseCase {
  constructor(
    private readonly postulationRepository: PostulationRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(
    userId: number,
    limit: number = 10,
  ): Promise<ProjectWithPostulationsRankingDto[]> {
    try {
      // Obtener todos los proyectos del usuario
      const userProjects = await this.projectRepository.findByUserId(userId);

      if (userProjects.length === 0) {
        return [];
      }

      // Crear array con proyectos y su conteo de postulaciones
      const projectsWithCounts: ProjectWithPostulationsRankingDto[] = [];

      for (const project of userProjects) {
        const postulationsCount =
          await this.postulationRepository.countByProjectId(project.id);
        projectsWithCounts.push({
          projectId: project.id,
          projectTitle: project.title,
          postulationsCount,
        });
      }

      // Ordenar por cantidad de postulaciones (descendente) y tomar el top
      return projectsWithCounts
        .sort((a, b) => b.postulationsCount - a.postulationsCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top projects by postulations:', error);
      return [];
    }
  }
}
