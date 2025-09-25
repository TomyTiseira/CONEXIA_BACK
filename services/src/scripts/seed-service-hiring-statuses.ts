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
      name: 'Completado',
      code: ServiceHiringStatusCode.COMPLETED,
      description: 'Servicio completado',
    },
    {
      name: 'Negociando',
      code: ServiceHiringStatusCode.NEGOTIATING,
      description: 'En proceso de negociación',
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
