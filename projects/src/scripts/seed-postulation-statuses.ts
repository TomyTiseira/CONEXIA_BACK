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
      name: 'Aceptada',
      code: PostulationStatusCode.ACCEPTED,
      description: 'Postulación aceptada por el dueño del proyecto',
      canTransitionToOthers: false,
      canBeModified: false,
      isFinal: true,
      displayOrder: 2,
    },
    {
      name: 'Rechazada',
      code: PostulationStatusCode.REJECTED,
      description: 'Postulación rechazada por el dueño del proyecto',
      canTransitionToOthers: false,
      canBeModified: false,
      isFinal: true,
      displayOrder: 3,
    },
    {
      name: 'Cancelada',
      code: PostulationStatusCode.CANCELLED,
      description: 'Postulación cancelada por el usuario',
      canTransitionToOthers: false,
      canBeModified: false,
      isFinal: true,
      displayOrder: 4,
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
