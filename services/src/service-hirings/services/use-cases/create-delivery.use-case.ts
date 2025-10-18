import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateDeliveryDto } from '../../dto/create-delivery.dto';
import { DeliverySubmissionResponseDto } from '../../dto/delivery-response.dto';
import { DeliverableStatus } from '../../entities/deliverable.entity';
import {
  DeliveryStatus,
  DeliverySubmission,
  DeliveryType,
} from '../../entities/delivery-submission.entity';
import { PaymentModalityCode } from '../../enums/payment-modality.enum';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { DeliverableRepository } from '../../repositories/deliverable.repository';
import { DeliverySubmissionRepository } from '../../repositories/delivery-submission.repository';
import { ServiceHiringStatusRepository } from '../../repositories/service-hiring-status.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';

@Injectable()
export class CreateDeliveryUseCase {
  constructor(
    private readonly serviceHiringRepository: ServiceHiringRepository,
    private readonly deliverableRepository: DeliverableRepository,
    private readonly deliveryRepository: DeliverySubmissionRepository,
    private readonly statusRepository: ServiceHiringStatusRepository,
  ) {}

  async execute(
    hiringId: number,
    serviceOwnerId: number,
    createDto: CreateDeliveryDto,
    attachmentPath?: string,
  ): Promise<DeliverySubmissionResponseDto> {
    // 1. Obtener la contratación con sus relaciones
    const hiring = await this.serviceHiringRepository.findById(hiringId, [
      'service',
      'status',
      'paymentModality',
      'deliverables',
    ]);

    if (!hiring) {
      throw new RpcException('Contratación de servicio no encontrada');
    }

    // 2. Validar que el usuario es el dueño del servicio
    if (hiring.service.userId !== serviceOwnerId) {
      throw new RpcException(
        'No tienes permisos para entregar este servicio. Solo el dueño del servicio puede hacer entregas.',
      );
    }

    // 3. Validar que el estado permite entregar
    // Estados permitidos: APPROVED (inicial), IN_PROGRESS (trabajando), REVISION_REQUESTED (re-entrega)
    const allowedStatuses = [
      ServiceHiringStatusCode.APPROVED,
      ServiceHiringStatusCode.IN_PROGRESS,
      ServiceHiringStatusCode.REVISION_REQUESTED,
    ];

    if (!allowedStatuses.includes(hiring.status.code)) {
      throw new RpcException(
        `No puedes entregar un servicio en estado ${hiring.status.name}. Estados permitidos: Aprobado, En Progreso, Revisión Solicitada.`,
      );
    }

    // 4. Determinar tipo de entrega y validaciones
    let deliveryType: DeliveryType;
    let price: number;
    let deliverableId: number | null = null;

    if (hiring.paymentModality?.code === PaymentModalityCode.BY_DELIVERABLES) {
      // Para servicios con pago por entregables
      if (!createDto.deliverableId) {
        throw new RpcException(
          'Debes especificar el ID del entregable para servicios con pago por entregables',
        );
      }

      const deliverable = await this.deliverableRepository.findById(
        createDto.deliverableId,
      );

      if (!deliverable || deliverable.hiringId !== hiringId) {
        throw new RpcException(
          'Entregable no encontrado o no pertenece a esta contratación',
        );
      }

      // Validar estado de entregas existentes
      const existingDelivery =
        await this.deliveryRepository.findLatestByDeliverableId(
          createDto.deliverableId,
        );

      if (existingDelivery) {
        // No permitir re-entregar si ya está aprobado
        if (existingDelivery.status === DeliveryStatus.APPROVED) {
          throw new RpcException(
            'Este entregable ya ha sido entregado y aprobado',
          );
        }

        // No permitir re-entregar si ya hay una entrega esperando revisión
        // (solo permitir si está en revision_requested)
        if (
          existingDelivery.status === DeliveryStatus.DELIVERED ||
          existingDelivery.status === DeliveryStatus.PENDING_PAYMENT
        ) {
          throw new RpcException(
            'Ya existe una entrega pendiente de revisión. Espera la respuesta del cliente.',
          );
        }

        // ✅ Permitir re-entregar si el estado es REVISION_REQUESTED
        console.log('✅ Re-entregando después de solicitud de revisión', {
          deliverableId: createDto.deliverableId,
          previousDeliveryId: existingDelivery.id,
          previousStatus: existingDelivery.status,
        });
      }

      deliveryType = DeliveryType.DELIVERABLE;
      price = Number(deliverable.price);
      deliverableId = deliverable.id;
    } else {
      // Para servicios con pago total
      deliveryType = DeliveryType.FULL;
      price = Number(hiring.quotedPrice);

      // Validar estado de entregas existentes
      const existingDelivery =
        await this.deliveryRepository.findLatestByHiringId(hiringId);

      if (existingDelivery) {
        // No permitir re-entregar si ya está aprobado
        if (existingDelivery.status === DeliveryStatus.APPROVED) {
          throw new RpcException(
            'Este servicio ya ha sido entregado y aprobado',
          );
        }

        // No permitir re-entregar si ya hay una entrega esperando revisión
        // (solo permitir si está en revision_requested)
        if (
          existingDelivery.status === DeliveryStatus.DELIVERED ||
          existingDelivery.status === DeliveryStatus.PENDING_PAYMENT
        ) {
          throw new RpcException(
            'Ya existe una entrega pendiente de revisión. Espera la respuesta del cliente.',
          );
        }

        // ✅ Permitir re-entregar si el estado es REVISION_REQUESTED
        console.log('✅ Re-entregando después de solicitud de revisión', {
          hiringId,
          previousDeliveryId: existingDelivery.id,
          previousStatus: existingDelivery.status,
        });
      }
    }

    // 5. Crear la entrega
    const delivery = await this.deliveryRepository.create({
      hiringId,
      deliverableId: deliverableId || undefined,
      deliveryType,
      content: createDto.content,
      attachmentPath,
      price,
      status: DeliveryStatus.DELIVERED,
      deliveredAt: new Date(),
    });

    console.log('✅ Delivery created:', {
      id: delivery.id,
      hiringId,
      deliverableId,
      deliveryType,
      price,
      hasAttachment: !!attachmentPath,
    });

    // 6. Actualizar estado del entregable si aplica
    if (deliverableId) {
      await this.deliverableRepository.update(deliverableId, {
        status: DeliverableStatus.DELIVERED,
        deliveredAt: new Date(),
      });
    }

    // 7. Actualizar el estado del hiring
    // Si venía de REVISION_REQUESTED, cambiar a DELIVERED
    // Para múltiples deliverables, recalcular el estado basándose en todos
    await this.serviceHiringRepository.recalculateStatusFromDeliveries(
      hiringId,
    );

    console.log('✅ Hiring status recalculated after delivery submission', {
      hiringId,
      deliveryId: delivery.id,
      previousStatus: hiring.status.code,
    });

    // 8. Retornar respuesta
    return this.transformToResponse(delivery);
  }

  private transformToResponse(
    delivery: DeliverySubmission,
  ): DeliverySubmissionResponseDto {
    return {
      id: delivery.id,
      hiringId: delivery.hiringId,
      deliverableId: delivery.deliverableId,
      deliveryType: delivery.deliveryType,
      content: delivery.content,
      attachmentPath: delivery.attachmentPath, // Ya viene como /uploads/deliveries/archivo.ext
      attachmentUrl: delivery.attachmentPath, // Enviar el mismo path, el frontend construye la URL
      price: Number(delivery.price),
      status: delivery.status,
      needsWatermark: delivery.status !== DeliveryStatus.APPROVED, // Mostrar marca de agua hasta que se apruebe y pague
      deliveredAt: delivery.deliveredAt,
      reviewedAt: delivery.reviewedAt,
      approvedAt: delivery.approvedAt,
      revisionNotes: delivery.revisionNotes,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    };
  }
}
