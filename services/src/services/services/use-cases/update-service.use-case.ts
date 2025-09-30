import { Injectable } from '@nestjs/common';
import {
  ServiceAlreadyDeletedException,
  ServiceNotFoundException,
  ServiceNotOwnedByUserException,
} from '../../../common/exceptions/services.exceptions';
import { Service } from '../../entities/service.entity';
import { TimeUnit } from '../../enums/time-unit.enum';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class UpdateServiceUseCase {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(
    serviceId: number,
    userId: number,
    updates: {
      price?: number;
      estimatedHours?: number | null;
      timeUnit?: TimeUnit;
    },
  ): Promise<Service> {
    // Buscar el servicio por ID (incluyendo eliminados para validar si existe)
    const service =
      await this.serviceRepository.findByIdIncludingDeleted(serviceId);
    if (!service) {
      throw new ServiceNotFoundException(serviceId);
    }

    // Validar que el servicio no esté eliminado
    if (service.deletedAt) {
      throw new ServiceAlreadyDeletedException(serviceId);
    }

    // Validar que el servicio pertenezca al usuario que lo quiere editar
    if (service.userId !== userId) {
      throw new ServiceNotOwnedByUserException(serviceId, userId);
    }

    // Realizar la actualización
    const updatedService = await this.serviceRepository.updateService(
      service,
      updates,
    );

    return updatedService;
  }
}
