import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ReviewAction, ReviewDeliveryDto } from '../../dto/review-delivery.dto';
import { DeliverableStatus } from '../../entities/deliverable.entity';
import {
  DeliveryStatus,
  DeliverySubmission,
} from '../../entities/delivery-submission.entity';
import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '../../entities/payment.entity';
import { DeliverableRepository } from '../../repositories/deliverable.repository';
import { DeliverySubmissionRepository } from '../../repositories/delivery-submission.repository';
import { PaymentRepository } from '../../repositories/payment.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';

@Injectable()
export class ReviewDeliveryUseCase {
  constructor(
    private readonly deliveryRepository: DeliverySubmissionRepository,
    private readonly serviceHiringRepository: ServiceHiringRepository,
    private readonly deliverableRepository: DeliverableRepository,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(
    deliveryId: number,
    clientUserId: number,
    reviewDto: ReviewDeliveryDto,
  ): Promise<DeliverySubmission> {
    // 1. Obtener la entrega con sus relaciones
    const delivery = await this.deliveryRepository.findById(deliveryId);

    if (!delivery) {
      throw new RpcException('Entrega no encontrada');
    }

    // 2. Validar que el usuario es el cliente que solicitó el servicio
    if (delivery.hiring.userId !== clientUserId) {
      throw new RpcException(
        'No tienes permisos para revisar esta entrega. Solo el cliente que solicitó el servicio puede revisarla.',
      );
    }

    // 3. Validar que la entrega está en estado DELIVERED
    if (delivery.status !== DeliveryStatus.DELIVERED) {
      throw new RpcException(
        `Esta entrega no puede ser revisada. Estado actual: ${delivery.status}`,
      );
    }

    // 4. Validar notas si se solicita revisión
    if (
      reviewDto.action === ReviewAction.REQUEST_REVISION &&
      (!reviewDto.notes || reviewDto.notes.trim().length === 0)
    ) {
      throw new RpcException(
        'Debes proporcionar notas explicando qué necesita ser revisado',
      );
    }

    // 5. Procesar la acción
    const now = new Date();

    if (reviewDto.action === ReviewAction.APPROVE) {
      // Aprobar entrega
      const updatedDelivery = await this.deliveryRepository.update(deliveryId, {
        status: DeliveryStatus.APPROVED,
        approvedAt: now,
        reviewedAt: now,
      });

      // Actualizar estado del entregable si aplica
      if (delivery.deliverableId) {
        await this.deliverableRepository.update(delivery.deliverableId, {
          status: DeliverableStatus.APPROVED,
          approvedAt: now,
        });

        // Crear registro de pago para el entregable
        await this.paymentRepository.create({
          hiringId: delivery.hiringId,
          amount: delivery.price,
          totalAmount: delivery.price,
          status: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.DIGITAL_WALLET, // MercadoPago
          paymentType: PaymentType.DELIVERABLE,
          deliverableId: delivery.deliverableId,
        });
      }

      console.log('✅ Delivery approved:', {
        deliveryId,
        hiringId: delivery.hiringId,
        deliverableId: delivery.deliverableId,
        price: delivery.price,
      });

      if (!updatedDelivery) {
        throw new RpcException('Error al actualizar la entrega');
      }

      return updatedDelivery;
    } else {
      // Solicitar revisión
      const updatedDelivery = await this.deliveryRepository.update(deliveryId, {
        status: DeliveryStatus.REVISION_REQUESTED,
        reviewedAt: now,
        revisionNotes: reviewDto.notes,
      });

      // Actualizar estado del entregable si aplica
      if (delivery.deliverableId) {
        await this.deliverableRepository.update(delivery.deliverableId, {
          status: DeliverableStatus.IN_PROGRESS,
        });
      }

      console.log('🔄 Revision requested:', {
        deliveryId,
        hiringId: delivery.hiringId,
        deliverableId: delivery.deliverableId,
        notes: reviewDto.notes,
      });

      if (!updatedDelivery) {
        throw new RpcException('Error al actualizar la entrega');
      }

      return updatedDelivery;
    }
  }
}
