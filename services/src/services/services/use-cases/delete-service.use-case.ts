import { Injectable } from '@nestjs/common';
import {
  ServiceAlreadyDeletedException,
  ServiceHasActiveContractsException,
  ServiceNotFoundException,
  ServiceNotOwnedByUserException,
} from '../../../common/exceptions/services.exceptions';
import { ServiceHiringRepository } from '../../../service-hirings/repositories/service-hiring.repository';
import { Service } from '../../entities/service.entity';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class DeleteServiceUseCase {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly serviceHiringRepository: ServiceHiringRepository,
  ) {}

  async execute(
    serviceId: number,
    reason: string,
    userId: number,
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

    // Validar que el servicio pertenezca al usuario que lo quiere eliminar
    if (service.userId !== userId) {
      throw new ServiceNotOwnedByUserException(serviceId, userId);
    }

    // Validar que no tenga contrataciones activas (en curso)
    // En curso está cuando no está en los estados aceptado, cancelado o rechazado
    const hasActiveHirings =
      await this.serviceHiringRepository.hasActiveHiringsForService(serviceId);
    if (hasActiveHirings) {
      throw new ServiceHasActiveContractsException(serviceId);
    }

    // Realizar la baja lógica del servicio
    await this.serviceRepository.deleteService(service, reason);

    return service;
  }
}
