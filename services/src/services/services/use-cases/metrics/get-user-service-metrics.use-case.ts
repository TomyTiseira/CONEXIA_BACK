import { Injectable } from '@nestjs/common';
import { ServiceHiringRepository } from '../../../../service-hirings/repositories/service-hiring.repository';
import { UserServiceMetricsDto } from '../../../dto/service-metrics.dto';

@Injectable()
export class GetUserServiceMetricsUseCase {
  constructor(
    private readonly serviceHiringRepository: ServiceHiringRepository,
  ) {}

  async execute(userId: number): Promise<UserServiceMetricsDto> {
    try {
      // Obtener todas las contrataciones completadas del usuario como proveedor del servicio
      const hirings =
        await this.serviceHiringRepository.findCompletedByProviderId(userId);

      const totalServicesHired = hirings.length;
      const totalRevenueGenerated = hirings.reduce((sum, hiring) => {
        return sum + Number(hiring.quotedPrice || 0);
      }, 0);

      return {
        totalServicesHired,
        totalRevenueGenerated,
      };
    } catch (error) {
      console.error('Error getting user service metrics:', error);
      return {
        totalServicesHired: 0,
        totalRevenueGenerated: 0,
      };
    }
  }
}
