import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { DeliverySubmissionResponseDto } from '../../dto/delivery-response.dto';
import { ReviewAction, ReviewDeliveryDto } from '../../dto/review-delivery.dto';
import { DeliverableStatus } from '../../entities/deliverable.entity';
import {
  DeliveryStatus,
  DeliverySubmission,
  DeliveryType,
} from '../../entities/delivery-submission.entity';
import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '../../entities/payment.entity';
import { PaymentModalityCode } from '../../enums/payment-modality.enum';
import { DeliverableRepository } from '../../repositories/deliverable.repository';
import { DeliverySubmissionRepository } from '../../repositories/delivery-submission.repository';
import { PaymentRepository } from '../../repositories/payment.repository';
import { ServiceHiringStatusRepository } from '../../repositories/service-hiring-status.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { MercadoPagoService } from '../mercado-pago.service';

@Injectable()
export class ReviewDeliveryUseCase {
  constructor(
    private readonly deliveryRepository: DeliverySubmissionRepository,
    private readonly serviceHiringRepository: ServiceHiringRepository,
    private readonly deliverableRepository: DeliverableRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly statusRepository: ServiceHiringStatusRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(
    deliveryId: number,
    clientUserId: number,
    reviewDto: ReviewDeliveryDto,
  ): Promise<{ delivery: DeliverySubmissionResponseDto; paymentUrl?: string }> {
    // 1. Obtener la entrega con sus relaciones
    const delivery = await this.deliveryRepository.findById(deliveryId);

    if (!delivery) {
      throw new RpcException('Entrega no encontrada');
    }

    // Obtener el hiring con todas sus relaciones
    const hiring = await this.serviceHiringRepository.findById(
      delivery.hiringId,
      ['service', 'paymentModality', 'deliverables'],
    );

    if (!hiring) {
      throw new RpcException('Contratación no encontrada');
    }

    // 2. Validar que el usuario es el cliente que solicitó el servicio
    if (hiring.userId !== clientUserId) {
      throw new RpcException(
        'No tienes permisos para revisar esta entrega. Solo el cliente que solicitó el servicio puede revisarla.',
      );
    }

    // 3. Validar estado de la entrega según la acción
    if (reviewDto.action === ReviewAction.APPROVE) {
      // Para aprobar: permitir DELIVERED (primera vez) y PENDING_PAYMENT (reintento)
      if (
        delivery.status !== DeliveryStatus.DELIVERED &&
        delivery.status !== DeliveryStatus.PENDING_PAYMENT
      ) {
        throw new RpcException(
          `Esta entrega no puede ser aprobada. Estado actual: ${delivery.status}. ` +
            `Solo se pueden aprobar entregas en estado "delivered" o "pending_payment".`,
        );
      }
    } else if (reviewDto.action === ReviewAction.REQUEST_REVISION) {
      // Para solicitar revisión: solo permitir DELIVERED
      if (delivery.status !== DeliveryStatus.DELIVERED) {
        throw new RpcException(
          `No se puede solicitar revisión de esta entrega. Estado actual: ${delivery.status}. ` +
            `Solo se puede solicitar revisión de entregas en estado "delivered".`,
        );
      }
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
      return await this.approveDelivery(delivery, hiring, now);
    } else {
      return await this.requestRevision(
        delivery,
        hiring,
        reviewDto.notes!,
        now,
      );
    }
  }

  private async approveDelivery(
    delivery: DeliverySubmission,
    hiring: any,
    now: Date,
  ): Promise<{ delivery: DeliverySubmissionResponseDto; paymentUrl?: string }> {
    // 1. Verificar si ya está en PENDING_PAYMENT (reintento)
    const isRetry = delivery.status === DeliveryStatus.PENDING_PAYMENT;

    if (isRetry) {
      console.log('🔄 Retry payment detected - will regenerate payment link:', {
        deliveryId: delivery.id,
        currentStatus: delivery.status,
        previousPaymentId: delivery.mercadoPagoPaymentId,
      });
    }

    // 2. Actualizar estado a PENDING_PAYMENT (solo si no es reintento)
    let updatedDelivery: DeliverySubmission;
    if (!isRetry) {
      const updated = await this.deliveryRepository.update(delivery.id, {
        status: DeliveryStatus.PENDING_PAYMENT,
        reviewedAt: now,
        // approvedAt se establecerá cuando se confirme el pago en el webhook
      });

      if (!updated) {
        throw new RpcException('Error al actualizar la entrega');
      }
      updatedDelivery = updated;
    } else {
      // Si es reintento, usar la entrega actual
      updatedDelivery = delivery;
    }

    // 2. NO actualizar el entregable todavía - se hará en el webhook
    // El entregable se marcará como APPROVED cuando se confirme el pago

    // 3. Crear preferencia de pago en MercadoPago
    // Calcular el monto correcto según la modalidad de pago
    let paymentAmount: number;
    let itemTitle: string;
    let itemDescription: string;

    if (hiring.paymentModality?.code === PaymentModalityCode.FULL_PAYMENT) {
      // Para full_payment: cobrar el 75% restante del precio total
      const totalPrice = Number(hiring.quotedPrice);
      paymentAmount = Math.round(totalPrice * 0.75);
      itemTitle = `Pago final - ${hiring.service.title}`;
      itemDescription = `Pago del 75% restante por ${hiring.service.title}`;
    } else if (
      hiring.paymentModality?.code === PaymentModalityCode.BY_DELIVERABLES
    ) {
      // Para by_deliverables: cobrar el precio del entregable
      paymentAmount = Number(delivery.price);
      itemTitle = `Entregable - ${hiring.service.title}`;
      itemDescription = `Pago por entregable de ${hiring.service.title}`;
    } else {
      // Fallback: usar el precio de la entrega
      paymentAmount = Number(delivery.price);
      itemTitle = `Pago - ${hiring.service.title}`;
      itemDescription = `Pago por servicio ${hiring.service.title}`;
    }

    console.log('💰 Payment calculation:', {
      modalityCode: hiring.paymentModality?.code,
      totalPrice: hiring.quotedPrice,
      deliveryPrice: delivery.price,
      calculatedAmount: paymentAmount,
      title: itemTitle,
    });

    // 4. Obtener o crear registro de pago
    const paymentType =
      hiring.paymentModality?.code === PaymentModalityCode.FULL_PAYMENT
        ? PaymentType.FINAL
        : delivery.deliveryType === DeliveryType.FULL
          ? PaymentType.FULL
          : PaymentType.DELIVERABLE;

    let payment;

    // Si es reintento y ya existe un payment, reutilizarlo
    if (isRetry && delivery.mercadoPagoPaymentId) {
      payment = await this.paymentRepository.findById(
        parseInt(delivery.mercadoPagoPaymentId),
      );

      if (payment) {
        console.log('♻️ Reusing existing payment record:', {
          paymentId: payment.id,
          status: payment.status,
        });
      }
    }

    // Si no hay payment (primera vez o no se encontró el existente), crear uno nuevo
    if (!payment) {
      payment = await this.paymentRepository.create({
        hiringId: delivery.hiringId,
        amount: paymentAmount,
        totalAmount: Number(hiring.quotedPrice),
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.DIGITAL_WALLET,
        paymentType,
        deliverableId: delivery.deliverableId,
        deliverySubmissionId: delivery.id, // Guardar referencia a la entrega
      });

      console.log('🆕 Created new payment record:', {
        paymentId: payment.id,
      });
    }

    // 3. Crear preferencia de pago en MercadoPago con el payment.id en external_reference
    const preference = await this.mercadoPagoService.createPreference({
      items: [
        {
          title: itemTitle,
          description: itemDescription,
          quantity: 1,
          unit_price: paymentAmount,
          currency_id: 'ARS',
        },
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/service-hirings/payment/success`,
        pending: `${process.env.FRONTEND_URL}/service-hirings/payment/pending`,
        failure: `${process.env.FRONTEND_URL}/service-hirings/payment/failure`,
      },
      notification_url: `${process.env.API_BASE_URL}/api/webhooks/mercadopago`,
      external_reference: `hiring_${hiring.id}_payment_${payment.id}`,
      binary_mode: true,
    });

    // 5. Actualizar el payment con el preference ID
    await this.paymentRepository.update(payment.id, {
      mercadoPagoPreferenceId: preference.id,
    });

    // 6. Actualizar la entrega con el payment ID para rastreo
    await this.deliveryRepository.update(delivery.id, {
      mercadoPagoPaymentId: payment.id.toString(),
    });

    console.log('⏳ Delivery marked as PENDING_PAYMENT:', {
      deliveryId: delivery.id,
      hiringId: delivery.hiringId,
      deliverableId: delivery.deliverableId,
      paymentId: payment.id,
      paymentAmount: paymentAmount,
      totalPrice: hiring.quotedPrice,
      paymentType: paymentType,
      externalReference: `hiring_${hiring.id}_payment_${payment.id}`,
      paymentUrl: preference.init_point,
      status: 'PENDING_PAYMENT - Waiting for payment confirmation',
    });

    // 5. Retornar la entrega actualizada con la URL de pago
    return {
      delivery: this.transformToDto(updatedDelivery),
      paymentUrl: preference.init_point,
    };
  }

  private async requestRevision(
    delivery: DeliverySubmission,
    hiring: any,
    notes: string,
    now: Date,
  ): Promise<{ delivery: DeliverySubmissionResponseDto }> {
    // 1. Actualizar estado de la entrega a REVISION_REQUESTED
    const updatedDelivery = await this.deliveryRepository.update(delivery.id, {
      status: DeliveryStatus.REVISION_REQUESTED,
      reviewedAt: now,
      revisionNotes: notes,
    });

    if (!updatedDelivery) {
      throw new RpcException('Error al actualizar la entrega');
    }

    // 2. Actualizar estado del entregable si aplica
    if (delivery.deliverableId) {
      await this.deliverableRepository.update(delivery.deliverableId, {
        status: DeliverableStatus.REVISION_REQUESTED, // Cambiar a REVISION_REQUESTED en lugar de IN_PROGRESS
      });
    }

    // 3. Cambiar el estado del hiring de vuelta a IN_PROGRESS

    // Recalculate hiring status based on all deliveries
    await this.serviceHiringRepository.recalculateStatusFromDeliveries(
      hiring.id,
    );

    console.log('🔄 Revision requested:', {
      deliveryId: delivery.id,
      hiringId: delivery.hiringId,
      deliverableId: delivery.deliverableId,
      notes,
      action: 'recalculate_hiring_status',
    });

    return { delivery: this.transformToDto(updatedDelivery) };
  }

  private transformToDto(
    delivery: DeliverySubmission,
  ): DeliverySubmissionResponseDto {
    // ⚠️ CRÍTICO: Mapear attachments con URLs completas
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const attachments =
      delivery.attachments?.map((att) => ({
        id: att.id,
        filePath: att.filePath,
        fileUrl: att.fileUrl || `${baseUrl}${att.filePath}`, // URL completa
        fileName: att.fileName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        orderIndex: att.orderIndex,
      })) || [];

    return {
      id: delivery.id,
      hiringId: delivery.hiringId,
      deliverableId: delivery.deliverableId,
      deliveryType: delivery.deliveryType,
      content: delivery.content,
      attachmentPath: delivery.attachmentPath, // DEPRECATED: usar attachments[]
      attachmentUrl: delivery.attachmentPath
        ? `${baseUrl}${delivery.attachmentPath}`
        : undefined, // DEPRECATED: URL completa
      attachmentSize: delivery.attachmentSize, // DEPRECATED: usar attachments[]
      attachments, // ✅ Array de archivos con URLs completas
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
