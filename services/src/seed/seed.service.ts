import { Injectable, OnModuleInit } from '@nestjs/common';
import { PaymentModalityCode } from '../service-hirings/enums/payment-modality.enum';
import { ServiceHiringStatusCode } from '../service-hirings/enums/service-hiring-status.enum';
import { PaymentModalityRepository } from '../service-hirings/repositories/payment-modality.repository';
import { ServiceHiringStatusRepository } from '../service-hirings/repositories/service-hiring-status.repository';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private readonly statusRepository: ServiceHiringStatusRepository,
    private readonly paymentModalityRepository: PaymentModalityRepository,
  ) {}

  async onModuleInit() {
    console.log('🌱 Running seeds...');
    await this.seedServiceHiringStatuses();
    await this.seedPaymentModalities();
  }

  private async seedServiceHiringStatuses() {
    const statuses = [
      {
        name: 'Pendiente',
        code: ServiceHiringStatusCode.PENDING,
        description: 'Solicitud de contratación pendiente de cotización',
      },
      {
        name: 'Cotizado',
        code: ServiceHiringStatusCode.QUOTED,
        description: 'Solicitud con cotización enviada',
      },
      {
        name: 'Aceptado',
        code: ServiceHiringStatusCode.ACCEPTED,
        description: 'Cotización aceptada por el cliente',
      },
      {
        name: 'Rechazado',
        code: ServiceHiringStatusCode.REJECTED,
        description: 'Cotización rechazada por el cliente',
      },
      {
        name: 'Cancelado',
        code: ServiceHiringStatusCode.CANCELLED,
        description: 'Solicitud cancelada',
      },
      {
        name: 'En Progreso',
        code: ServiceHiringStatusCode.IN_PROGRESS,
        description: 'Servicio en progreso',
      },
      {
        name: 'Completado',
        code: ServiceHiringStatusCode.COMPLETED,
        description: 'Servicio completado',
      },
      {
        name: 'Negociando',
        code: ServiceHiringStatusCode.NEGOTIATING,
        description: 'En proceso de negociación',
      },
      {
        name: 'Aprobada',
        code: ServiceHiringStatusCode.APPROVED,
        description: 'Contratación aprobada y pago confirmado',
      },
      {
        name: 'Pago en Proceso',
        code: ServiceHiringStatusCode.PAYMENT_PENDING,
        description:
          'El cliente fue redirigido a MercadoPago y el pago está siendo procesado. Esperando confirmación del webhook.',
      },
      {
        name: 'Pago Rechazado',
        code: ServiceHiringStatusCode.PAYMENT_REJECTED,
        description:
          'El pago fue rechazado o cancelado por MercadoPago. El cliente puede reintentar.',
      },
      {
        name: 'Vencida',
        code: ServiceHiringStatusCode.EXPIRED,
        description: 'Cotización vencida por tiempo límite',
      },
      {
        name: 'Entregado',
        code: ServiceHiringStatusCode.DELIVERED,
        description:
          'Servicio o entregable entregado, esperando revisión del cliente',
      },
      {
        name: 'Revisión Solicitada',
        code: ServiceHiringStatusCode.REVISION_REQUESTED,
        description:
          'Cliente solicitó cambios en una o más entregas del servicio',
      },
      {
        name: 'En Reclamo',
        code: ServiceHiringStatusCode.IN_CLAIM,
        description:
          'Servicio tiene un reclamo activo. Todas las acciones están suspendidas hasta que se resuelva',
      },
      {
        name: 'Re-cotizando',
        code: ServiceHiringStatusCode.REQUOTING,
        description:
          'El cliente ha solicitado una actualización de la cotización vencida',
      },
      {
        name: 'Cancelado por reclamo',
        code: ServiceHiringStatusCode.CANCELLED_BY_CLAIM,
        description:
          'Contratación cancelada por reclamo resuelto a favor del cliente',
      },
      {
        name: 'Finalizado por reclamo',
        code: ServiceHiringStatusCode.COMPLETED_BY_CLAIM,
        description:
          'Contratación finalizada por reclamo resuelto a favor del proveedor',
      },
      {
        name: 'Finalizado con acuerdo',
        code: ServiceHiringStatusCode.COMPLETED_WITH_AGREEMENT,
        description: 'Contratación finalizada con acuerdo parcial tras reclamo',
      },
      {
        name: 'Terminado por Moderación',
        code: ServiceHiringStatusCode.TERMINATED_BY_MODERATION,
        description:
          'Servicio terminado porque el proveedor o cliente fue baneado permanentemente',
      },
      {
        name: 'Finalizado por Moderación',
        code: ServiceHiringStatusCode.FINISHED_BY_MODERATION,
        description: 'Servicio finalizado por decisión de moderación',
      },
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const status of statuses) {
      try {
        const existing = await this.statusRepository.findByCode(status.code);
        if (!existing) {
          await this.statusRepository.create(status);
          createdCount++;
          console.log(`✅ Status created: ${status.name}`);
        } else {
          existingCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating status ${status.name}:`, error);
      }
    }

    console.log(
      `🌱 Service hiring statuses seed completed: ${createdCount} created, ${existingCount} already existed`,
    );
  }

  private async seedPaymentModalities() {
    const modalities = [
      {
        name: 'Pago total al finalizar',
        code: PaymentModalityCode.FULL_PAYMENT,
        description:
          'Pago completo al finalizar el servicio. Se cobra 25% al aceptar la cotización y 75% al completar el servicio.',
        initialPaymentPercentage: 25,
        finalPaymentPercentage: 75,
        isActive: true,
      },
      {
        name: 'Pago por entregables',
        code: PaymentModalityCode.BY_DELIVERABLES,
        description:
          'Pago fraccionado según entregables definidos. Se paga cada entregable al ser aprobado por el cliente.',
        isActive: true,
      },
    ] as const;

    let createdCount = 0;
    let existingCount = 0;

    for (const modality of modalities) {
      try {
        const existing = await this.paymentModalityRepository.findByCode(
          modality.code,
        );
        if (!existing) {
          await this.paymentModalityRepository.create(modality as any);
          createdCount++;
          console.log(`✅ Payment modality created: ${modality.name}`);
        } else {
          existingCount++;
        }
      } catch (error) {
        console.error(
          `❌ Error creating payment modality ${modality.name}:`,
          error,
        );
      }
    }

    console.log(
      `🌱 Payment modalities seed completed: ${createdCount} created, ${existingCount} already existed`,
    );
  }
}
