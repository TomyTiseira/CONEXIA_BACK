import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { DeliverableResponseDto } from '../../dto/deliverable-response.dto';
import { DeliveryStatus } from '../../entities/delivery-submission.entity';
import { DeliverableRepository } from '../../repositories/deliverable.repository';
import { DeliverySubmissionRepository } from '../../repositories/delivery-submission.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';

@Injectable()
export class GetDeliverablesWithStatusUseCase {
  constructor(
    private readonly serviceHiringRepository: ServiceHiringRepository,
    private readonly deliverableRepository: DeliverableRepository,
    private readonly deliveryRepository: DeliverySubmissionRepository,
  ) {}

  async execute(
    hiringId: number,
    userId: number,
  ): Promise<DeliverableResponseDto[]> {
    // Obtener la contratación
    const hiring = await this.serviceHiringRepository.findById(hiringId, [
      'service',
      'deliverables',
    ]);

    if (!hiring) {
      throw new RpcException('Contratación de servicio no encontrada');
    }

    // Verificar que el usuario tiene permiso (es el cliente o el dueño del servicio)
    const isClient = hiring.userId === userId;
    const isServiceOwner = hiring.service.userId === userId;

    if (!isClient && !isServiceOwner) {
      throw new RpcException(
        'No tienes permisos para ver los entregables de esta contratación',
      );
    }

    // Obtener todos los deliverables ordenados
    const deliverables = hiring.deliverables || [];
    const sortedDeliverables = deliverables.sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );

    // Procesar cada deliverable con su estado de bloqueo
    const deliverablesWithStatus: DeliverableResponseDto[] = [];

    for (let i = 0; i < sortedDeliverables.length; i++) {
      const deliverable = sortedDeliverables[i];

      // Obtener la última entrega de este deliverable
      const latestDelivery =
        await this.deliveryRepository.findLatestByDeliverableId(deliverable.id);

      let isLocked = false;
      let lockReason: string | undefined;
      let canDeliver = true;
      let canView = true;

      // Si no es el primer entregable, verificar el estado del anterior
      if (i > 0) {
        const previousDeliverable = sortedDeliverables[i - 1];
        const previousDeliveries =
          await this.deliveryRepository.findByDeliverableId(
            previousDeliverable.id,
          );

        // Si el anterior no tiene entregas
        if (previousDeliveries.length === 0) {
          canDeliver = false; // Proveedor no puede entregar si no entregó el anterior

          // ✅ Solo el CLIENTE tiene restricción de visualización
          if (isClient) {
            isLocked = true;
            lockReason = `El entregable anterior "${previousDeliverable.title}" aún no ha sido entregado`;
            canView = false; // Cliente no puede ver si no hay entrega del anterior
          }
          // El proveedor (service owner) SIEMPRE puede ver sus entregas (no bloqueado)
        } else {
          const latestPreviousDelivery = previousDeliveries[0];

          // ✅ El proveedor SÍ puede entregar aunque el anterior no esté pagado
          // Solo el CLIENTE tiene restricción de visualización hasta que pague
          if (latestPreviousDelivery.status !== DeliveryStatus.APPROVED) {
            canDeliver = true; // ✅ Proveedor SÍ puede entregar

            // ✅ Solo bloquear visualización para el CLIENTE
            if (isClient) {
              isLocked = true;
              lockReason = `El entregable anterior "${previousDeliverable.title}" debe ser aprobado y pagado para poder visualizarlo`;
              canView = false; // ❌ Cliente NO puede ver hasta que pague el anterior
            }
            // El proveedor (service owner) SIEMPRE puede ver sus entregas (no bloqueado)
          }
        }
      }

      // Si este deliverable tiene una entrega pendiente de revisión, el proveedor no puede entregar de nuevo
      if (latestDelivery) {
        if (
          latestDelivery.status === DeliveryStatus.DELIVERED ||
          latestDelivery.status === DeliveryStatus.PENDING_PAYMENT
        ) {
          canDeliver = false; // Ya hay una entrega esperando revisión
        }

        if (latestDelivery.status === DeliveryStatus.APPROVED) {
          canDeliver = false; // Ya fue aprobado
        }
      }

      deliverablesWithStatus.push({
        id: deliverable.id,
        hiringId: deliverable.hiringId,
        title: deliverable.title,
        description: deliverable.description,
        estimatedDeliveryDate: deliverable.estimatedDeliveryDate,
        price: Number(deliverable.price),
        orderIndex: deliverable.orderIndex,
        status: deliverable.status,
        deliveredAt: deliverable.deliveredAt || null,
        approvedAt: deliverable.approvedAt || null,
        createdAt: deliverable.createdAt,
        updatedAt: deliverable.updatedAt,
        isLocked,
        lockReason,
        canDeliver,
        canView,
        latestDeliveryId: latestDelivery?.id,
        latestDeliveryStatus: latestDelivery?.status,
      });
    }

    return deliverablesWithStatus;
  }
}
