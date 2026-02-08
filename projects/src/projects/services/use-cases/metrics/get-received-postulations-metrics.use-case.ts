import { Injectable } from '@nestjs/common';
import { PostulationRepository } from '../../../../postulations/repositories/postulation.repository';
import {
  PostulationStatusBreakdown,
  ReceivedPostulationsDto,
} from '../../../dtos/project-dashboard-metrics.dto';
import { ProjectRepository } from '../../../repositories/project.repository';

@Injectable()
export class GetReceivedPostulationsMetricsUseCase {
  constructor(
    private readonly postulationRepository: PostulationRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(userId: number): Promise<ReceivedPostulationsDto> {
    try {
      // Obtener todos los proyectos del usuario
      const userProjects = await this.projectRepository.findByUserId(userId);
      const projectIds = userProjects.map((p) => p.id);

      if (projectIds.length === 0) {
        return {
          total: 0,
          byStatus: this.getEmptyStatusBreakdown(),
        };
      }

      // Obtener todas las postulaciones recibidas en los proyectos del usuario
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const receivedPostulations =
        await this.postulationRepository.findByProjectIds(projectIds);

      // Contar postulaciones por estado
      const byStatus: PostulationStatusBreakdown = {
        activo: 0,
        pendiente_evaluacion: 0,
        evaluacion_expirada: 0,
        aceptada: 0,
        rechazada: 0,
        cancelada: 0,
        cancelada_moderacion: 0,
      };

      receivedPostulations.forEach((postulation) => {
        let statusCode = postulation.status?.code as string;
        // Mapear código de DB a formato en español
        if (statusCode === 'cancelled_by_moderation') {
          statusCode = 'cancelada_moderacion';
        }
        if (statusCode && statusCode in byStatus) {
          byStatus[statusCode as keyof PostulationStatusBreakdown]++;
        }
      });

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        total: receivedPostulations.length,
        byStatus,
      };
    } catch (error) {
      console.error('Error getting received postulations metrics:', error);
      return {
        total: 0,
        byStatus: this.getEmptyStatusBreakdown(),
      };
    }
  }

  private getEmptyStatusBreakdown(): PostulationStatusBreakdown {
    return {
      activo: 0,
      pendiente_evaluacion: 0,
      evaluacion_expirada: 0,
      aceptada: 0,
      rechazada: 0,
      cancelada: 0,
      cancelada_moderacion: 0,
    };
  }
}
