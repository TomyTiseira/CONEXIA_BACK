import { Injectable, OnModuleInit } from '@nestjs/common';
import { ServiceHiringStatusCode } from '../service-hirings/enums/service-hiring-status.enum';
import { ServiceHiringStatusRepository } from '../service-hirings/repositories/service-hiring-status.repository';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private readonly statusRepository: ServiceHiringStatusRepository,
  ) {}

  async onModuleInit() {
    console.log('🌱 Running seeds...');
    await this.seedServiceHiringStatuses();
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
        name: 'Vencida',
        code: ServiceHiringStatusCode.EXPIRED,
        description: 'Cotización vencida por tiempo límite',
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
}
