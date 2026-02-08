import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PreviousDeliverableNotDeliveredYetException } from '../../../common/exceptions/delivery.exceptions';
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
import { DeliveryAttachmentRepository } from '../../repositories/delivery-attachment.repository';
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
    private readonly deliveryAttachmentRepository: DeliveryAttachmentRepository,
  ) {}

  async execute(
    hiringId: number,
    serviceOwnerId: number,
    createDto: CreateDeliveryDto,
    files?: any[], // Array de archivos Multer
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
    // Estados permitidos: APPROVED (inicial), IN_PROGRESS (trabajando),
    // REVISION_REQUESTED (re-entrega), DELIVERED (para múltiples entregables)
    const allowedStatuses = [
      ServiceHiringStatusCode.APPROVED,
      ServiceHiringStatusCode.IN_PROGRESS,
      ServiceHiringStatusCode.REVISION_REQUESTED,
      ServiceHiringStatusCode.DELIVERED, // ✅ Permitir cuando ya hay entregas anteriores
    ];

    if (!allowedStatuses.includes(hiring.status.code)) {
      throw new RpcException(
        `No puedes entregar un servicio en estado ${hiring.status.name}. Estados permitidos: Aprobado, En Progreso, Revisión Solicitada, Entregado.`,
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

      // 🆕 VALIDACIÓN: Verificar que los entregables anteriores hayan sido ENTREGADOS
      // (No es necesario que estén pagados, solo que hayan sido subidos)
      // Obtener todos los entregables de esta contratación ordenados por orderIndex
      const allDeliverables = hiring.deliverables || [];
      const sortedDeliverables = allDeliverables.sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );

      // Encontrar el índice del entregable actual
      const currentIndex = sortedDeliverables.findIndex(
        (d) => d.id === deliverable.id,
      );

      // Si no es el primer entregable, validar que los anteriores fueron entregados
      if (currentIndex > 0) {
        for (let i = 0; i < currentIndex; i++) {
          const previousDeliverable = sortedDeliverables[i];

          // Verificar si el entregable anterior tiene al menos una entrega
          const previousDeliveries =
            await this.deliveryRepository.findByDeliverableId(
              previousDeliverable.id,
            );

          if (previousDeliveries.length === 0) {
            // No hay entregas para el entregable anterior
            throw new PreviousDeliverableNotDeliveredYetException(
              previousDeliverable.title,
              previousDeliverable.orderIndex,
            );
          }

          // ✅ CAMBIO: Solo verificar que exista una entrega, NO que esté pagada
          // El cliente es quien tiene la restricción de pago para ver/pagar el siguiente
        }
      }

      // Validar estado de entregas existentes para este entregable
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
    // ⚠️ IMPORTANTE: Mantener attachmentPath y attachmentSize por retrocompatibilidad
    // Si solo hay 1 archivo, guardarlo también en los campos antiguos
    const firstFile = files && files.length > 0 ? files[0] : null;

    const delivery = await this.deliveryRepository.create({
      hiringId,
      deliverableId: deliverableId || undefined,
      deliveryType,
      content: createDto.content,
      attachmentPath: firstFile
        ? `/uploads/deliveries/${firstFile.filename}`
        : undefined,
      attachmentSize: firstFile ? firstFile.size : undefined,
      price,
      status: DeliveryStatus.DELIVERED,
      deliveredAt: new Date(),
    });

    // 6. Crear registros de attachments si hay archivos
    if (files && files.length > 0) {
      // ⚠️ CRÍTICO: Usar la URL base del entorno para URLs completas
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

      const attachmentsData = files.map((file, index) => ({
        deliveryId: delivery.id,
        filePath: `/uploads/deliveries/${file.filename}`,
        fileUrl: `${baseUrl}/uploads/deliveries/${file.filename}`, // URL completa
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        orderIndex: index,
      }));

      await this.deliveryAttachmentRepository.createMany(attachmentsData);
    }

    // 7. Actualizar estado del entregable si aplica
    if (deliverableId) {
      await this.deliverableRepository.update(deliverableId, {
        status: DeliverableStatus.DELIVERED,
        deliveredAt: new Date(),
      });
    }

    // 8. Actualizar el estado del hiring
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

    // 9. Cargar el delivery con sus attachments para retornar
    const deliveryWithAttachments = await this.deliveryRepository.findById(
      delivery.id,
    );

    // 10. Retornar respuesta
    return this.transformToResponse(deliveryWithAttachments || delivery);
  }

  private transformToResponse(
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
