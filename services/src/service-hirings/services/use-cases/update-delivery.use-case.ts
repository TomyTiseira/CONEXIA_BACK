import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { DeliverySubmissionResponseDto } from '../../dto/delivery-response.dto';
import { UpdateDeliveryDto } from '../../dto/update-delivery.dto';
import {
  DeliveryStatus,
  DeliverySubmission,
} from '../../entities/delivery-submission.entity';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { DeliverySubmissionRepository } from '../../repositories/delivery-submission.repository';
import { ServiceHiringStatusRepository } from '../../repositories/service-hiring-status.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';

@Injectable()
export class UpdateDeliveryUseCase {
  constructor(
    private readonly deliveryRepository: DeliverySubmissionRepository,
    private readonly serviceHiringRepository: ServiceHiringRepository,
    private readonly statusRepository: ServiceHiringStatusRepository,
  ) {}

  async execute(
    deliveryId: number,
    serviceOwnerId: number,
    updateDto: UpdateDeliveryDto,
  ): Promise<DeliverySubmissionResponseDto> {
    // 1. Obtener la entrega con sus relaciones
    const delivery = await this.deliveryRepository.findById(deliveryId);

    if (!delivery) {
      throw new RpcException('Entrega no encontrada');
    }

    // 2. Obtener el hiring para validar ownership
    const hiring = await this.serviceHiringRepository.findById(
      delivery.hiringId,
      ['service'],
    );

    if (!hiring) {
      throw new RpcException('Contratación no encontrada');
    }

    // 3. Validar que el usuario es el dueño del servicio
    if (hiring.service.userId !== serviceOwnerId) {
      throw new RpcException(
        'No tienes permisos para actualizar esta entrega. Solo el prestador del servicio puede hacerlo.',
      );
    }

    // 4. Validar que la entrega está en estado REVISION_REQUESTED
    if (delivery.status !== DeliveryStatus.REVISION_REQUESTED) {
      throw new RpcException(
        `Esta entrega no puede ser actualizada. Estado actual: ${delivery.status}. Solo se pueden actualizar entregas con revisión solicitada.`,
      );
    }

    // 5. Actualizar la entrega con los nuevos datos
    const now = new Date();
    const updatedDelivery = await this.deliveryRepository.update(deliveryId, {
      ...(updateDto.content && { content: updateDto.content }),
      ...(updateDto.attachmentPath && {
        attachmentPath: updateDto.attachmentPath,
      }),
      status: DeliveryStatus.DELIVERED, // Volver a estado DELIVERED para que el cliente revise
      deliveredAt: now,
      reviewedAt: undefined, // Limpiar fecha de revisión anterior
      revisionNotes: undefined, // Limpiar notas de revisión
    });

    if (!updatedDelivery) {
      throw new RpcException('Error al actualizar la entrega');
    }

    // 6. Cambiar el estado del hiring de vuelta a DELIVERED
    const deliveredStatus = await this.statusRepository.findByCode(
      ServiceHiringStatusCode.DELIVERED,
    );

    if (deliveredStatus) {
      await this.serviceHiringRepository.update(hiring.id, {
        statusId: deliveredStatus.id,
      });
    }

    // Recalculate hiring status in case multiple deliveries affect overall status
    await this.serviceHiringRepository.recalculateStatusFromDeliveries(
      hiring.id,
    );

    return this.transformToDto(updatedDelivery);
  }

  private transformToDto(
    delivery: DeliverySubmission,
  ): DeliverySubmissionResponseDto {
    return {
      id: delivery.id,
      hiringId: delivery.hiringId,
      deliverableId: delivery.deliverableId,
      deliveryType: delivery.deliveryType,
      content: delivery.content,
      attachmentPath: delivery.attachmentPath,
      attachmentUrl: delivery.attachmentPath,
      price: Number(delivery.price),
      status: delivery.status,
      needsWatermark: delivery.status !== DeliveryStatus.APPROVED,
      deliveredAt: delivery.deliveredAt,
      reviewedAt: delivery.reviewedAt,
      approvedAt: delivery.approvedAt,
      revisionNotes: delivery.revisionNotes,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    };
  }
}
