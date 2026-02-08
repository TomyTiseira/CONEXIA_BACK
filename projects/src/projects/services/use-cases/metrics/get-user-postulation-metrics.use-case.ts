import { Injectable } from '@nestjs/common';
import { PostulationRepository } from '../../../../postulations/repositories/postulation.repository';
import { PostulationStatusBreakdown } from '../../../dtos/project-dashboard-metrics.dto';

export interface UserPostulationMetrics {
  totalPostulations: number;
  acceptedPostulations: number;
  successRate: number;
  byStatus?: PostulationStatusBreakdown;
}

@Injectable()
export class GetUserPostulationMetricsUseCase {
  constructor(private readonly postulationRepository: PostulationRepository) {}

  async execute(userId: number): Promise<UserPostulationMetrics> {
    try {
      // Obtener todas las postulaciones del usuario
      const allPostulations =
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

      allPostulations.forEach((postulation) => {
        let statusCode = postulation.status?.code as string;
        // Mapear código de DB a formato en español
        if (statusCode === 'cancelled_by_moderation') {
          statusCode = 'cancelada_moderacion';
        }
        if (statusCode && statusCode in byStatus) {
          byStatus[statusCode as keyof PostulationStatusBreakdown]++;
        }
      });

      // Contar postulaciones aceptadas
      const acceptedPostulations = byStatus.aceptada;

      // Calcular postulaciones evaluables (excluir canceladas)
      const cancelledPostulations =
        byStatus.cancelada + byStatus.cancelada_moderacion;
      const evaluablePostulations =
        allPostulations.length - cancelledPostulations;

      // Calcular tasa de éxito (solo sobre postulaciones evaluables)
      const successRate =
        evaluablePostulations > 0
          ? (acceptedPostulations / evaluablePostulations) * 100
          : 0;

      return {
        totalPostulations: allPostulations.length,
        acceptedPostulations,
        successRate: Math.round(successRate * 100) / 100, // Redondear a 2 decimales
        byStatus,
      };
    } catch (error) {
      console.error('Error getting user postulation metrics:', error);
      return {
        totalPostulations: 0,
        acceptedPostulations: 0,
        successRate: 0,
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
