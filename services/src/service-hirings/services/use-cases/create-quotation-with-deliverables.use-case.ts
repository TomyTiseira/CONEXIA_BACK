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
export class CreateQuotationWithDeliverablesUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly statusService: ServiceHiringStatusService,
    private readonly validationService: ServiceHiringValidationService,
    private readonly operationsService: ServiceHiringOperationsService,
    private readonly transformService: ServiceHiringTransformService,
    private readonly paymentModalityRepository: PaymentModalityRepository,
    private readonly deliverableRepository: DeliverableRepository,
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
      throw new RpcException(
        'No tienes permisos para cotizar esta contratación',
      );
    }

    // Validar que se puede cotizar
    if (!(await this.operationsService.canPerformAction(hiring, 'quote'))) {
      throw new RpcException(
        'No se puede cotizar esta contratación en su estado actual',
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
      // Para pago total, validar que se incluye el precio
      if (!quotationDto.quotedPrice || quotationDto.quotedPrice <= 0) {
        throw new RpcException(
          'El precio cotizado es requerido para la modalidad de pago total',
        );
      }
    } else if (paymentModality.code === PaymentModalityCode.BY_DELIVERABLES) {
      // Para pago por entregables, validar que se incluyen entregables
      if (
        !quotationDto.deliverables ||
        quotationDto.deliverables.length === 0
      ) {
        throw new RpcException(
          'Los entregables son requeridos para la modalidad de pago por entregables',
        );
      }

      // Validar que todos los entregables tengan datos completos
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

      // Calcular el precio total de los entregables
      const totalPrice = quotationDto.deliverables.reduce(
        (sum, d) => sum + d.price,
        0,
      );
      quotationDto.quotedPrice = totalPrice;
    }

    // Obtener el estado "quoted"
    const quotedStatus = await this.statusService.getStatusByCode(
      ServiceHiringStatusCode.QUOTED,
    );

    // Actualizar la contratación con la cotización
    const updatedHiring = await this.hiringRepository.update(hiring.id, {
      quotedPrice: quotationDto.quotedPrice,
      estimatedHours: quotationDto.estimatedHours,
      estimatedTimeUnit: quotationDto.estimatedTimeUnit as any,
      quotationNotes: quotationDto.quotationNotes,
      quotationValidityDays: quotationDto.quotationValidityDays,
      paymentModalityId: quotationDto.paymentModalityId,
      quotedAt: new Date(),
      statusId: quotedStatus.id,
    });

    if (!updatedHiring) {
      throw new RpcException('Error al crear la cotización');
    }

    // Si es pago por entregables, crear los entregables
    if (
      paymentModality.code === PaymentModalityCode.BY_DELIVERABLES &&
      quotationDto.deliverables
    ) {
      const deliverablesData = quotationDto.deliverables.map((d, index) => ({
        hiringId: updatedHiring.id,
        title: d.title,
        description: d.description,
        estimatedDeliveryDate: new Date(d.estimatedDeliveryDate),
        price: d.price,
        orderIndex: index + 1,
      }));

      await this.deliverableRepository.createMany(deliverablesData);
    }

    return this.transformService.transformToResponse(updatedHiring);
  }
}
