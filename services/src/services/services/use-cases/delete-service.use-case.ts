import { Injectable } from '@nestjs/common';
import {
  ServiceAlreadyDeletedException,
  ServiceNotFoundException,
  ServiceNotOwnedByUserException,
} from '../../../common/exceptions/services.exceptions';
import { Service } from '../../entities/service.entity';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class DeleteServiceUseCase {
  constructor(private readonly serviceRepository: ServiceRepository) {}

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

    // TODO: Validar que no tenga contrataciones activas
    // Esto requeriría comunicarse con el microservicio de contratos
    // Por ahora asumimos que no hay contratos activos
    // En una implementación completa, aquí se haría una consulta al microservicio de contratos

    // Realizar la baja lógica del servicio
    await this.serviceRepository.deleteService(service, reason);

    return service;
  }
}
