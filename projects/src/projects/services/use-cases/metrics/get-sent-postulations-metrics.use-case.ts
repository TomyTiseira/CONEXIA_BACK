import { Injectable } from '@nestjs/common';
import { PostulationRepository } from '../../../../postulations/repositories/postulation.repository';
import {
  PostulationStatusBreakdown,
  SentPostulationsDto,
} from '../../../dtos/project-dashboard-metrics.dto';

@Injectable()
export class GetSentPostulationsMetricsUseCase {
  constructor(private readonly postulationRepository: PostulationRepository) {}

  async execute(userId: number): Promise<SentPostulationsDto> {
    try {
      // Obtener todas las postulaciones enviadas por el usuario
      const sentPostulations =
        await this.postulationRepository.findByUserId(userId);

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

      sentPostulations.forEach((postulation) => {
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
        total: sentPostulations.length,
        byStatus,
      };
    } catch (error) {
      console.error('Error getting sent postulations metrics:', error);
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
