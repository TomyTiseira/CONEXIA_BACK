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
export class EditQuotationUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly validationService: ServiceHiringValidationService,
    private readonly operationsService: ServiceHiringOperationsService,
    private readonly transformService: ServiceHiringTransformService,
    private readonly statusService: ServiceHiringStatusService,
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

    // Si la cotización está en estado NEGOTIATING o REQUOTING, cambiar a QUOTED
    let newStatusId = hiring.statusId;
    if (
      hiring.status?.code === ServiceHiringStatusCode.NEGOTIATING ||
      hiring.status?.code === ServiceHiringStatusCode.REQUOTING
    ) {
      const quotedStatus = await this.statusService.getStatusByCode(
        ServiceHiringStatusCode.QUOTED,
      );
      newStatusId = quotedStatus.id;
    }

    // Preparar datos de actualización
    const updateData: any = {
      quotedPrice: quotationDto.quotedPrice,
      estimatedHours: quotationDto.estimatedHours,
      estimatedTimeUnit: quotationDto.estimatedTimeUnit,
      quotationNotes: quotationDto.quotationNotes,
      quotationValidityDays: quotationDto.quotationValidityDays,
      isBusinessDays: quotationDto.isBusinessDays || false,
      hoursPerDay: quotationDto.hoursPerDay !== undefined ? quotationDto.hoursPerDay : null,
      workOnBusinessDaysOnly: quotationDto.workOnBusinessDaysOnly !== undefined ? quotationDto.workOnBusinessDaysOnly : false,
      quotedAt: new Date(),
      statusId: newStatusId,
    };

    // Si estaba en REQUOTING, limpiar el timestamp de solicitud
    if (hiring.status?.code === ServiceHiringStatusCode.REQUOTING) {
      updateData.requoteRequestedAt = null;
    }

    // Actualizar la cotización
    const updatedHiring = await this.hiringRepository.update(
      hiring.id,
      updateData,
    );

    if (!updatedHiring) {
      throw new RpcException('Error al editar la cotización');
    }

    return this.transformService.transformToResponse(updatedHiring);
  }
}
