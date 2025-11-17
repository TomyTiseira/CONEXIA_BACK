import { Injectable } from '@nestjs/common';
import { ServiceHiringRepository } from '../../../../service-hirings/repositories/service-hiring.repository';
import { AdminServiceMetricsDto } from '../../../dto/service-metrics.dto';

@Injectable()
export class GetAdminServiceMetricsUseCase {
  constructor(
    private readonly serviceHiringRepository: ServiceHiringRepository,
  ) {}

  async execute(): Promise<AdminServiceMetricsDto> {
    try {
      // Obtener el total de contrataciones completadas
      const totalServicesHired =
        await this.serviceHiringRepository.getTotalCompletedHirings();

      // Obtener el revenue total
      const totalRevenue = await this.serviceHiringRepository.getTotalRevenue();

      // Obtener contrataciones por tipo
      const byType =
        await this.serviceHiringRepository.getServiceHiringsByType();

      return {
        totalServicesHired,
        totalRevenue,
        byType,
      };
    } catch (error) {
      console.error('Error getting admin service metrics:', error);
      return {
        totalServicesHired: 0,
        totalRevenue: 0,
        byType: [],
      };
    }
  }
}
