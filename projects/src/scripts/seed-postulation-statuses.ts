import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { PostulationStatus } from '../postulations/entities/postulation-status.entity';
import { PostulationStatusCode } from '../postulations/enums/postulation-status.enum';

async function seedPostulationStatuses() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const postulationStatusRepository =
    dataSource.getRepository(PostulationStatus);

  const statuses = [
    {
      name: 'Activa',
      code: PostulationStatusCode.ACTIVE,
      description: 'Postulación en estado activo, pendiente de revisión',
      canTransitionToOthers: true,
      canBeModified: true,
      isFinal: false,
      displayOrder: 1,
    },
    {
      name: 'Pendiente Evaluación',
      code: PostulationStatusCode.PENDING_EVALUATION,
      description: 'Postulación pendiente de completar prueba técnica',
      canTransitionToOthers: true,
      canBeModified: true,
      isFinal: false,
      displayOrder: 2,
    },
    {
      name: 'Evaluación Expirada',
      code: PostulationStatusCode.EVALUATION_EXPIRED,
      description: 'No se completó la prueba técnica en el tiempo establecido',
      canTransitionToOthers: false,
      canBeModified: false,
      isFinal: true,
      displayOrder: 3,
    },
    {
      name: 'Aceptada',
      code: PostulationStatusCode.ACCEPTED,
      description: 'Postulación aceptada por el dueño del proyecto',
      canTransitionToOthers: false,
      canBeModified: false,
      isFinal: true,
      displayOrder: 4,
    },
    {
      name: 'Rechazada',
      code: PostulationStatusCode.REJECTED,
      description: 'Postulación rechazada por el dueño del proyecto',
      canTransitionToOthers: false,
      canBeModified: false,
      isFinal: true,
      displayOrder: 5,
    },
    {
      name: 'Cancelada',
      code: PostulationStatusCode.CANCELLED,
      description: 'Postulación cancelada por el usuario',
      canTransitionToOthers: false,
      canBeModified: false,
      isFinal: true,
      displayOrder: 6,
    },
    {
      name: 'Cancelada por Moderación',
      code: PostulationStatusCode.CANCELLED_BY_MODERATION,
      description:
        'Postulación cancelada porque el usuario o el dueño del proyecto fue baneado',
      canTransitionToOthers: false,
      canBeModified: false,
      isFinal: true,
      displayOrder: 7,
    },
    {
      name: 'Cancelada por Suspensión',
      code: PostulationStatusCode.CANCELLED_BY_SUSPENSION,
      description:
        'Postulación cancelada porque el usuario fue suspendido temporalmente',
      canTransitionToOthers: false,
      canBeModified: false,
      isFinal: true,
      displayOrder: 8,
    },
  ];

  for (const statusData of statuses) {
    const existingStatus = await postulationStatusRepository.findOne({
      where: { code: statusData.code },
    });

    if (!existingStatus) {
      const status = postulationStatusRepository.create(statusData);
      await postulationStatusRepository.save(status);
      console.log(`Estado '${statusData.name}' creado.`);
    } else {
      console.log(`Estado '${statusData.name}' ya existe.`);
    }
  }

  console.log('Seed de estados de postulación finalizado.');
  await app.close();
}

void seedPostulationStatuses();
