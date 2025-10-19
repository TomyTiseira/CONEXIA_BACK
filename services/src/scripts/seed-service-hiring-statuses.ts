import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ServiceHiringStatusCode } from '../service-hirings/enums/service-hiring-status.enum';
import { ServiceHiringStatusRepository } from '../service-hirings/repositories/service-hiring-status.repository';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const statusRepository = app.get(ServiceHiringStatusRepository);

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
    {
      name: 'En Reclamo',
      code: ServiceHiringStatusCode.IN_CLAIM,
      description:
        'Servicio tiene un reclamo activo. Todas las acciones están suspendidas hasta que se resuelva',
    },
    // Estados finales por resolución de reclamos
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
  ];

  for (const status of statuses) {
    const existing = await statusRepository.findByCode(status.code);
    if (!existing) {
      await statusRepository.create(status);
      console.log(`Status created: ${status.name}`);
    } else {
      console.log(`Status already exists: ${status.name}`);
    }
  }

  console.log('Service hiring statuses seed completed');
  await app.close();
}

bootstrap().catch(console.error);
