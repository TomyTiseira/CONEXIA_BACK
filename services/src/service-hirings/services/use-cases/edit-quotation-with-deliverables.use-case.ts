import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ServiceRepository } from '../../../services/repositories/service.repository';
import { CreateQuotationWithDeliverablesDto } from '../../dto';
import { PaymentModalityCode } from '../../enums/payment-modality.enum';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { DeliverableRepository } from '../../repositories/deliverable.repository';
import { PaymentModalityRepository } from '../../repositories/payment-modality.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { ServiceHiringOperationsService } from '../service-hiring-operations.service';
import { ServiceHiringStatusService } from '../service-hiring-status.service';
import { ServiceHiringTransformService } from '../service-hiring-transform.service';
import { ServiceHiringValidationService } from '../service-hiring-validation.service';

@Injectable()
export class EditQuotationWithDeliverablesUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly validationService: ServiceHiringValidationService,
    private readonly operationsService: ServiceHiringOperationsService,
    private readonly transformService: ServiceHiringTransformService,
    private readonly paymentModalityRepository: PaymentModalityRepository,
    private readonly deliverableRepository: DeliverableRepository,
    private readonly statusService: ServiceHiringStatusService,
  ) {}

  async execute(
    serviceOwnerId: number,
    hiringId: number,
    quotationDto: CreateQuotationWithDeliverablesDto,
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

    // Validar la modalidad de pago
    const paymentModality = await this.paymentModalityRepository.findById(
      quotationDto.paymentModalityId,
    );
    if (!paymentModality || !paymentModality.isActive) {
      throw new RpcException('Modalidad de pago inválida');
    }

    // Validar según la modalidad de pago
    if (paymentModality.code === PaymentModalityCode.FULL_PAYMENT) {
      if (!quotationDto.quotedPrice || quotationDto.quotedPrice <= 0) {
        throw new RpcException(
          'El precio cotizado es requerido para la modalidad de pago total',
        );
      }
    } else if (paymentModality.code === PaymentModalityCode.BY_DELIVERABLES) {
      if (
        !quotationDto.deliverables ||
        quotationDto.deliverables.length === 0
      ) {
        throw new RpcException(
          'Los entregables son requeridos para la modalidad de pago por entregables',
        );
      }

      for (const deliverable of quotationDto.deliverables) {
        if (
          !deliverable.title ||
          !deliverable.description ||
          !deliverable.estimatedDeliveryDate ||
          !deliverable.price ||
          deliverable.price <= 0
        ) {
          throw new RpcException(
            'Todos los entregables deben tener título, descripción, fecha de entrega y precio',
          );
        }
      }

      const totalPrice = quotationDto.deliverables.reduce(
        (sum, d) => sum + d.price,
        0,
      );
      quotationDto.quotedPrice = totalPrice;
    }

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
      estimatedTimeUnit: quotationDto.estimatedTimeUnit as any,
      quotationNotes: quotationDto.quotationNotes,
      quotationValidityDays: quotationDto.quotationValidityDays,
      isBusinessDays: quotationDto.isBusinessDays || false,
      paymentModalityId: quotationDto.paymentModalityId,
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

    // Actualizar entregables si la modalidad es por entregables
    if (
      paymentModality.code === PaymentModalityCode.BY_DELIVERABLES &&
      quotationDto.deliverables
    ) {
      // Eliminar entregables existentes
      await this.deliverableRepository.deleteByHiringId(updatedHiring.id);

      // Crear nuevos entregables
      const deliverablesData = quotationDto.deliverables.map((d, index) => ({
        hiringId: updatedHiring.id,
        title: d.title,
        description: d.description,
        estimatedDeliveryDate: new Date(d.estimatedDeliveryDate),
        price: d.price,
        orderIndex: index + 1,
      }));

      await this.deliverableRepository.createMany(deliverablesData);
    } else {
      // Si cambió a modalidad de pago total, eliminar entregables
      await this.deliverableRepository.deleteByHiringId(updatedHiring.id);
    }

    return this.transformService.transformToResponse(updatedHiring);
  }
}
