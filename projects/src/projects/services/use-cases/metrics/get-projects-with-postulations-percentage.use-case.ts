import { Injectable } from '@nestjs/common';
import { PostulationRepository } from '../../../../postulations/repositories/postulation.repository';
import { ProjectRepository } from '../../../repositories/project.repository';

@Injectable()
export class GetProjectsWithPostulationsPercentageUseCase {
  constructor(
    private readonly postulationRepository: PostulationRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(userId: number): Promise<number> {
    try {
      // Obtener todos los proyectos del usuario
      const userProjects = await this.projectRepository.findByUserId(userId);

      if (userProjects.length === 0) {
        return 0;
      }

      // Contar cuántos proyectos recibieron al menos una postulación
      let projectsWithPostulations = 0;

      for (const project of userProjects) {
        const postulationsCount =
          await this.postulationRepository.countByProjectId(project.id);
        if (postulationsCount > 0) {
          projectsWithPostulations++;
        }
      }

      // Calcular porcentaje
      const percentage = (projectsWithPostulations / userProjects.length) * 100;
      return Math.round(percentage * 100) / 100; // Redondear a 2 decimales
    } catch (error) {
      console.error(
        'Error getting projects with postulations percentage:',
        error,
      );
      return 0;
    }
  }
}
