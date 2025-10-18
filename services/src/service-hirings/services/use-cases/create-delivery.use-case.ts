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

    // 3. Validar que el estado es APPROVED
    if (hiring.status.code !== ServiceHiringStatusCode.APPROVED) {
      throw new RpcException(
        `No puedes entregar un servicio que no ha sido aprobado. Estado actual: ${hiring.status.name}`,
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

      // Validar que no haya una entrega aprobada para este entregable
      const existingDelivery =
        await this.deliveryRepository.findLatestByDeliverableId(
          createDto.deliverableId,
        );

      if (
        existingDelivery &&
        existingDelivery.status === DeliveryStatus.APPROVED
      ) {
        throw new RpcException(
          'Este entregable ya ha sido entregado y aprobado',
        );
      }

      deliveryType = DeliveryType.DELIVERABLE;
      price = Number(deliverable.price);
      deliverableId = deliverable.id;
    } else {
      // Para servicios con pago total
      deliveryType = DeliveryType.FULL;
      price = Number(hiring.quotedPrice);

      // Validar que no haya una entrega aprobada para esta contratación
      const existingDelivery =
        await this.deliveryRepository.findLatestByHiringId(hiringId);

      if (
        existingDelivery &&
        existingDelivery.status === DeliveryStatus.APPROVED
      ) {
        throw new RpcException('Este servicio ya ha sido entregado y aprobado');
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

    // 7. Cambiar el estado del hiring a DELIVERED
    const deliveredStatus = await this.statusRepository.findByCode(
      ServiceHiringStatusCode.DELIVERED,
    );

    if (deliveredStatus) {
      await this.serviceHiringRepository.update(hiringId, {
        statusId: deliveredStatus.id,
      });

      console.log('✅ Hiring status updated to DELIVERED');
    }

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
