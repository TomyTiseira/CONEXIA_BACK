import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ServiceRepository } from '../../../services/repositories/service.repository';
import { CreateQuotationDto } from '../../dto';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { ServiceHiringOperationsService } from '../service-hiring-operations.service';
import { ServiceHiringStatusService } from '../service-hiring-status.service';
import { ServiceHiringTransformService } from '../service-hiring-transform.service';
import { ServiceHiringValidationService } from '../service-hiring-validation.service';

@Injectable()
export class CreateQuotationUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly statusService: ServiceHiringStatusService,
    private readonly validationService: ServiceHiringValidationService,
    private readonly operationsService: ServiceHiringOperationsService,
    private readonly transformService: ServiceHiringTransformService,
  ) {}

  async execute(
    serviceOwnerId: number,
    hiringId: number,
    quotationDto: CreateQuotationDto,
  ) {
    // Obtener la contratación
    const hiring = await this.hiringRepository.findById(hiringId);
    if (!hiring) {
      throw new RpcException('Contratación no encontrada');
    }

    // Verificar que el usuario es el dueño del servicio
    const service = await this.serviceRepository.findById(hiring.serviceId);
    if (!service || service.userId !== serviceOwnerId) {
      throw new RpcException(
        'No tienes permisos para cotizar esta contratación',
      );
    }

    // Validar que se puede cotizar
    if (!this.operationsService.canPerformAction(hiring, 'quote')) {
      throw new RpcException(
        'No se puede cotizar esta contratación en su estado actual',
      );
    }

    // Validar que el usuario solicitante sigue activo
    await this.validationService.validateServiceOwnerCanQuote(
      serviceOwnerId,
      hiring.userId,
    );

    // Obtener el estado "quoted"
    const quotedStatus = await this.statusService.getStatusByCode(
      ServiceHiringStatusCode.QUOTED,
    );

    // Actualizar la contratación con la cotización
    const updatedHiring = await this.hiringRepository.update(hiring.id, {
      quotedPrice: quotationDto.quotedPrice,
      estimatedHours: quotationDto.estimatedHours,
      quotationNotes: quotationDto.quotationNotes,
      quotedAt: new Date(),
      statusId: quotedStatus.id,
    });

    if (!updatedHiring) {
      throw new RpcException('Error al crear la cotización');
    }

    return this.transformService.transformToResponse(updatedHiring);
  }
}
