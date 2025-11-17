import { Injectable } from '@nestjs/common';
import { PostulationStatusCode } from '../../../../postulations/enums/postulation-status.enum';
import { PostulationRepository } from '../../../../postulations/repositories/postulation.repository';

export interface UserPostulationMetrics {
  totalPostulations: number;
  acceptedPostulations: number;
  successRate: number;
}

@Injectable()
export class GetUserPostulationMetricsUseCase {
  constructor(private readonly postulationRepository: PostulationRepository) {}

  async execute(userId: number): Promise<UserPostulationMetrics> {
    try {
      // Obtener todas las postulaciones del usuario
      const allPostulations =
        await this.postulationRepository.findByUserId(userId);
      // Contar postulaciones aceptadas
      const acceptedPostulations = allPostulations.filter(
        (p) => p.status?.code === PostulationStatusCode.ACCEPTED,
      );

      // Calcular tasa de éxito
      const successRate =
        allPostulations.length > 0
          ? (acceptedPostulations.length / allPostulations.length) * 100
          : 0;

      return {
        totalPostulations: allPostulations.length,
        acceptedPostulations: acceptedPostulations.length,
        successRate: Math.round(successRate * 100) / 100, // Redondear a 2 decimales
      };
    } catch (error) {
      console.error('Error getting user postulation metrics:', error);
      return {
        totalPostulations: 0,
        acceptedPostulations: 0,
        successRate: 0,
      };
    }
  }
}
