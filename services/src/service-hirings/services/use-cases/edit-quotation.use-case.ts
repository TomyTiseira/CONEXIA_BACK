import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ServiceRepository } from '../../../services/repositories/service.repository';
import { CreateQuotationDto } from '../../dto';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { ServiceHiringOperationsService } from '../service-hiring-operations.service';
import { ServiceHiringTransformService } from '../service-hiring-transform.service';
import { ServiceHiringValidationService } from '../service-hiring-validation.service';

@Injectable()
export class EditQuotationUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly serviceRepository: ServiceRepository,
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
      throw new RpcException('No tienes permisos para editar esta cotización');
    }

    // Validar que se puede editar la cotización
    if (!(await this.operationsService.canPerformAction(hiring, 'edit'))) {
      throw new RpcException(
        'No se puede editar esta cotización en su estado actual',
      );
    }

    // Validar que el usuario solicitante sigue activo
    await this.validationService.validateServiceOwnerCanQuote(
      serviceOwnerId,
      hiring.userId,
      hiringId,
    );

    // Actualizar la cotización sin cambiar el estado
    const updatedHiring = await this.hiringRepository.update(hiring.id, {
      quotedPrice: quotationDto.quotedPrice,
      estimatedHours: quotationDto.estimatedHours,
      estimatedTimeUnit: quotationDto.estimatedTimeUnit,
      quotationNotes: quotationDto.quotationNotes,
      quotationValidityDays: quotationDto.quotationValidityDays,
      quotedAt: new Date(),
    });

    if (!updatedHiring) {
      throw new RpcException('Error al editar la cotización');
    }

    return this.transformService.transformToResponse(updatedHiring);
  }
}
