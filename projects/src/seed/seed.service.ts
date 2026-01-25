import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostulationStatus } from '../postulations/entities/postulation-status.entity';
import { PostulationStatusCode } from '../postulations/enums/postulation-status.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(PostulationStatus)
    private readonly postulationStatusRepository: Repository<PostulationStatus>,
  ) {}

  async onModuleInit() {
    this.logger.log('🌱 Running seeds...');
    await this.seedPostulationStatuses();
  }

  private async seedPostulationStatuses() {
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
        description: 'Postulación cancelada porque el usuario o el dueño del proyecto fue baneado',
        canTransitionToOthers: false,
        canBeModified: false,
        isFinal: true,
        displayOrder: 7,
      },
      {
        name: 'Cancelada por Suspensión',
        code: PostulationStatusCode.CANCELLED_BY_SUSPENSION,
        description: 'Postulación cancelada porque el usuario fue suspendido temporalmente',
        canTransitionToOthers: false,
        canBeModified: false,
        isFinal: true,
        displayOrder: 8,
      },
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const statusData of statuses) {
      try {
        const existingStatus = await this.postulationStatusRepository.findOne({
          where: { code: statusData.code },
        });

        if (!existingStatus) {
          const status = this.postulationStatusRepository.create(statusData);
          await this.postulationStatusRepository.save(status);
          createdCount++;
          this.logger.log(`✅ Postulation status created: ${statusData.name}`);
        } else {
          existingCount++;
        }
      } catch (error) {
        this.logger.error(`❌ Error creating postulation status ${statusData.name}:`, error);
      }
    }

    this.logger.log(
      `🌱 Postulation statuses seed completed: ${createdCount} created, ${existingCount} already existed`,
    );
  }
}
