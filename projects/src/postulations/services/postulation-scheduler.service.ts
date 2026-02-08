import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { EmailService, UsersClientService } from 'src/common';
import { Postulation } from '../entities/postulation.entity';
import { PostulationStatusService } from './postulation-status.service';

interface UserProfile {
  name?: string;
  lastName?: string;
}

interface User {
  email: string;
}

interface UserWithProfile {
  user: User;
  profile?: UserProfile;
}

@Injectable()
export class PostulationSchedulerService {
  private readonly logger = new Logger(PostulationSchedulerService.name);

  constructor(
    @InjectRepository(Postulation)
    private readonly postulationRepository: Repository<Postulation>,
    private readonly postulationStatusService: PostulationStatusService,
    private readonly usersClientService: UsersClientService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Cron job que se ejecuta todos los días a las 3 AM
   * Marca como expiradas las postulaciones que están en estado "pendiente_evaluacion"
   * y cuyo evaluationDeadline ha pasado
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleExpiredEvaluations() {
    this.logger.log('Ejecutando verificación de evaluaciones expiradas...');

    try {
      const expiredCount = await this.expireOverdueEvaluations();
      this.logger.log(
        `Verificación completada. ${expiredCount} postulaciones marcadas como expiradas.`,
      );
    } catch (error) {
      this.logger.error(
        'Error en la verificación de evaluaciones expiradas:',
        error,
      );
    }
  }

  /**
   * Encuentra y actualiza todas las postulaciones con evaluación vencida
   * @returns Número de postulaciones actualizadas
   */
  async expireOverdueEvaluations(): Promise<number> {
    // Obtener el estado "pendiente_evaluacion"
    const pendingEvaluationStatus =
      await this.postulationStatusService.getPendingEvaluationStatus();

    if (!pendingEvaluationStatus) {
      this.logger.warn(
        'No se encontró el estado "pendiente_evaluacion". Abortando verificación.',
      );
      return 0;
    }

    // Obtener el estado "evaluacion_expirada"
    const expiredStatus =
      await this.postulationStatusService.getEvaluationExpiredStatus();

    if (!expiredStatus) {
      this.logger.warn(
        'No se encontró el estado "evaluacion_expirada". Abortando verificación.',
      );
      return 0;
    }

    const now = new Date();

    // Buscar postulaciones en estado "pendiente_evaluacion" con deadline vencido
    const expiredPostulations = await this.postulationRepository.find({
      where: {
        statusId: pendingEvaluationStatus.id,
        evaluationDeadline: LessThan(now),
      },
      relations: ['project'],
    });

    this.logger.log(
      `Se encontraron ${expiredPostulations.length} postulaciones con evaluación vencida.`,
    );

    let updatedCount = 0;

    for (const postulation of expiredPostulations) {
      try {
        // Actualizar el estado a "evaluacion_expirada"
        await this.postulationRepository.update(postulation.id, {
          statusId: expiredStatus.id,
        });

        updatedCount++;

        // Enviar notificación al usuario
        await this.notifyUserAboutExpiredEvaluation(postulation);

        this.logger.log(
          `Postulación ${postulation.id} marcada como evaluación expirada.`,
        );
      } catch (error) {
        this.logger.error(
          `Error al procesar postulación ${postulation.id}:`,
          error,
        );
      }
    }

    return updatedCount;
  }

  /**
   * Envía una notificación por email al usuario cuando su evaluación ha expirado
   * @param postulation - La postulación cuya evaluación ha expirado
   */
  private async notifyUserAboutExpiredEvaluation(
    postulation: Postulation,
  ): Promise<void> {
    try {
      const userWithProfile = (await this.usersClientService.getUserWithProfile(
        postulation.userId,
      )) as UserWithProfile | null;

      if (
        userWithProfile &&
        userWithProfile.user &&
        userWithProfile.user.email
      ) {
        const userName =
          userWithProfile.profile?.name ||
          userWithProfile.user.email.split('@')[0];

        const projectTitle = postulation.project?.title || 'Proyecto';

        // Enviar email de notificación (de forma asíncrona)
        this.emailService
          .sendEvaluationExpiredEmail(
            userWithProfile.user.email,
            userName,
            projectTitle,
          )
          .catch((error) => {
            this.logger.error(
              `Error al enviar email de evaluación expirada para postulación ${postulation.id}:`,
              error,
            );
          });
      }
    } catch (error) {
      this.logger.error(
        `Error al obtener información del usuario ${postulation.userId}:`,
        error,
      );
    }
  }
}
