import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { ServiceHiringOperationsService } from '../service-hiring-operations.service';
import { ServiceHiringStatusService } from '../service-hiring-status.service';
import { ServiceHiringTransformService } from '../service-hiring-transform.service';

@Injectable()
export class AcceptServiceHiringUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly statusService: ServiceHiringStatusService,
    private readonly operationsService: ServiceHiringOperationsService,
    private readonly transformService: ServiceHiringTransformService,
  ) {}

  async execute(userId: number, hiringId: number) {
    // Obtener la contratación
    const hiring = await this.hiringRepository.findById(hiringId);
    if (!hiring) {
      throw new RpcException('Contratación no encontrada');
    }

    // Verificar que el usuario es el dueño de la contratación
    if (hiring.userId !== userId) {
      throw new RpcException(
        'No tienes permisos para aceptar esta contratación',
      );
    }

    // Validar que se puede aceptar
    if (!this.operationsService.canPerformAction(hiring, 'accept')) {
      throw new RpcException(
        'No se puede aceptar esta contratación en su estado actual',
      );
    }

    // Obtener el estado "accepted"
    const acceptedStatus = await this.statusService.getStatusByCode(
      ServiceHiringStatusCode.ACCEPTED,
    );

    // Actualizar la contratación
    const updatedHiring = await this.hiringRepository.update(hiring.id, {
      statusId: acceptedStatus.id,
      respondedAt: new Date(),
    });

    if (!updatedHiring) {
      throw new RpcException('Error al aceptar la contratación');
    }

    return this.transformService.transformToResponse(updatedHiring);
  }
}
