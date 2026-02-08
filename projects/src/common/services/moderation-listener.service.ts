import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { IsNull, Repository } from 'typeorm';
import { USERS_SERVICE } from '../../config';
import { PostulationStatus } from '../../postulations/entities/postulation-status.entity';
import { Postulation } from '../../postulations/entities/postulation.entity';
import { PostulationStatusCode } from '../../postulations/enums/postulation-status.enum';
import { Project } from '../../projects/entities/project.entity';
import { EmailService } from './email.service';

@Injectable()
export class ModerationListenerService {
  private readonly logger = new Logger(ModerationListenerService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Postulation)
    private readonly postulationRepository: Repository<Postulation>,
    @InjectRepository(PostulationStatus)
    private readonly postulationStatusRepository: Repository<PostulationStatus>,
    @Inject(USERS_SERVICE)
    private readonly usersClient: ClientProxy,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Maneja el evento cuando un usuario es baneado
   */
  async handleUserBanned(userId: number): Promise<void> {
    this.logger.log(`Procesando baneo de usuario ${userId}`);

    try {
      // 1. Marcar proyectos con ownerModerationStatus='banned'
      const bannedProjects = await this.markUserProjectsAsBanned(userId);
      this.logger.log(
        `${bannedProjects} proyectos marcados como owner baneado (userId=${userId})`,
      );

      // 2. Cancelar postulaciones A proyectos del usuario (como owner) - NUEVO
      const cancelledPostulationsToProjects =
        await this.cancelPostulationsToUserProjects(userId);
      this.logger.log(
        `${cancelledPostulationsToProjects} postulaciones canceladas en proyectos del usuario (owner)`,
      );

      // 3. Cancelar TODAS las postulaciones DEL usuario (como postulante)
      const cancelledUserPostulations =
        await this.cancelAllUserPostulations(userId);
      this.logger.log(
        `${cancelledUserPostulations} postulaciones canceladas del usuario (postulante)`,
      );

      this.logger.log(`Baneo completado para usuario ${userId}`);
    } catch (error) {
      this.logger.error(`Error procesando baneo de usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Maneja el evento cuando un usuario es suspendido
   */
  async handleUserSuspended(userId: number): Promise<void> {
    this.logger.log(`Procesando suspensión de usuario ${userId}`);

    try {
      // Marcar proyectos con ownerModerationStatus='suspended' (sin cambiar estado)
      const suspendedProjects = await this.markUserProjectsAsSuspended(userId);
      this.logger.log(
        `${suspendedProjects} proyectos marcados como owner suspendido (userId=${userId})`,
      );

      // Los proyectos permanecen activos, el usuario puede cumplir compromisos existentes
      this.logger.log(`Suspensión procesada para usuario ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error procesando suspensión de usuario ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Maneja el evento cuando un usuario es reactivado
   */
  async handleUserReactivated(userId: number): Promise<void> {
    this.logger.log(`Procesando reactivación de usuario ${userId}`);

    try {
      // 1. Restaurar proyectos suspendidos
      const restoredProjects = await this.restoreUserProjects(userId);
      this.logger.log(
        `${restoredProjects} proyectos restaurados para usuario ${userId}`,
      );

      this.logger.log(`Reactivación completada para usuario ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error procesando reactivación de usuario ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Marca proyectos con ownerModerationStatus='banned'
   */
  private async markUserProjectsAsBanned(userId: number): Promise<number> {
    const result = await this.projectRepository.update(
      {
        userId,
        deletedAt: IsNull(),
      },
      {
        ownerModerationStatus: 'banned',
        suspendedByModeration: true,
        moderationReason: 'Proyecto suspendido - Propietario baneado',
        moderationUpdatedAt: new Date(),
        canAcceptPostulations: false,
      },
    );

    return result.affected || 0;
  }

  /**
   * Marca proyectos con ownerModerationStatus='suspended' (sin cambiar estado)
   */
  private async markUserProjectsAsSuspended(userId: number): Promise<number> {
    const result = await this.projectRepository.update(
      {
        userId,
        deletedAt: IsNull(),
      },
      {
        ownerModerationStatus: 'suspended',
        moderationReason: 'Propietario suspendido temporalmente',
        moderationUpdatedAt: new Date(),
      },
    );

    return result.affected || 0;
  }

  /**
   * Suspende todos los proyectos activos de un usuario (método legacy, ya no usado)
   */
  private async suspendUserProjects(
    userId: number,
    reason?: string,
  ): Promise<number> {
    // Obtener proyectos del usuario CON postulaciones antes de suspender
    const userProjects = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.postulations', 'postulation')
      .leftJoinAndSelect('postulation.status', 'status')
      .where('project.userId = :userId', { userId })
      .andWhere('project.isActive = :isActive', { isActive: true })
      .andWhere('project.deletedAt IS NULL')
      .getMany();

    // Actualizar estado de los proyectos
    const result = await this.projectRepository.update(
      {
        userId,
        isActive: true,
        deletedAt: IsNull(),
      },
      {
        suspendedByModeration: true,
        moderationReason: reason || 'Proyecto suspendido - Propietario baneado',
        moderationUpdatedAt: new Date(),
        canAcceptPostulations: false,
      },
    );

    // Obtener estado de "cancelled_by_moderation"
    const cancelledStatus = await this.postulationStatusRepository.findOne({
      where: { code: PostulationStatusCode.CANCELLED_BY_MODERATION },
    });

    if (!cancelledStatus) {
      this.logger.error('Estado "cancelled_by_moderation" no encontrado');
    }

    // Cancelar TODAS las postulaciones de los proyectos del owner baneado
    const allPostulationIds: number[] = [];
    for (const project of userProjects) {
      if (project.postulations && project.postulations.length > 0) {
        allPostulationIds.push(...project.postulations.map((p) => p.id));
      }
    }

    if (cancelledStatus && allPostulationIds.length > 0) {
      await this.postulationRepository
        .createQueryBuilder()
        .update(Postulation)
        .set({
          statusId: cancelledStatus.id,
          cancelledByModeration: true,
          moderationCancelledAt: new Date(),
          moderationCancelReason:
            reason ||
            'El propietario del proyecto ha sido suspendido por infracciones graves',
        })
        .where('id IN (:...postulationIds)', {
          postulationIds: allPostulationIds,
        })
        .execute();

      this.logger.log(
        `${allPostulationIds.length} postulaciones canceladas de proyectos del usuario ${userId}`,
      );
    }

    // Obtener información del owner baneado
    try {
      await firstValueFrom(
        this.usersClient.send('findUserByIdWithRelations', { id: userId }),
      );

      // Notificar a todos los postulantes de cada proyecto
      for (const project of userProjects) {
        for (const postulation of project.postulations || []) {
          try {
            // Obtener información del postulante
            const postulantUser = await firstValueFrom(
              this.usersClient.send('findUserByIdWithRelations', {
                id: postulation.userId,
              }),
            );

            if (postulantUser?.email) {
              const postulantName = postulantUser?.profile
                ? `${postulantUser.profile.name} ${postulantUser.profile.lastName}`.trim()
                : 'Usuario';

              const wasAccepted =
                postulation.status?.code === PostulationStatusCode.ACCEPTED;

              await this.emailService.sendProjectOwnerBannedEmail(
                postulantUser.email,
                postulantName,
                {
                  projectTitle: project.title,
                  projectId: project.id,
                  wasAccepted,
                  reason:
                    reason ||
                    'El propietario del proyecto ha sido suspendido por infracciones graves.',
                },
              );

              this.logger.log(
                `Email enviado a postulante ${postulantUser.email} sobre proyecto #${project.id}`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Error enviando email a postulante ${postulation.userId}:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        'Error obteniendo información del owner baneado:',
        error,
      );
    }

    return result.affected || 0;
  }

  /**
   * Restaura los proyectos suspendidos de un usuario y limpia ownerModerationStatus
   * Solo restaura proyectos con estado 'suspended', NO los baneados (permanentes)
   */
  private async restoreUserProjects(userId: number): Promise<number> {
    const result = await this.projectRepository.update(
      {
        userId,
        deletedAt: IsNull(),
        ownerModerationStatus: 'suspended', // Solo restaurar suspendidos, NO baneados
      },
      {
        ownerModerationStatus: null, // Limpiar el flag
        suspendedByModeration: false,
        moderationReason: null,
        moderationUpdatedAt: new Date(),
        canAcceptPostulations: true,
      },
    );

    return result.affected || 0;
  }

  /**
   * Cancela TODAS las postulaciones A proyectos del usuario (cuando el owner es baneado)
   * Notifica a los postulantes que su postulación fue cancelada porque el owner fue baneado
   */
  private async cancelPostulationsToUserProjects(
    userId: number,
  ): Promise<number> {
    const cancelledStatus = await this.postulationStatusRepository.findOne({
      where: { code: PostulationStatusCode.CANCELLED_BY_MODERATION },
    });

    if (!cancelledStatus) {
      this.logger.error(
        'Estado "cancelled_by_moderation" no encontrado en la base de datos',
      );
      return 0;
    }

    // Obtener todos los proyectos del usuario
    const userProjects = await this.projectRepository.find({
      where: {
        userId,
        deletedAt: IsNull(),
      },
      select: ['id', 'title'],
    });

    if (userProjects.length === 0) {
      return 0;
    }

    const projectIds = userProjects.map((p) => p.id);

    // Estados finales que no deben cambiar
    const finalStatusCodes = [
      PostulationStatusCode.REJECTED,
      PostulationStatusCode.CANCELLED,
      PostulationStatusCode.CANCELLED_BY_MODERATION,
      PostulationStatusCode.CANCELLED_BY_SUSPENSION,
    ];

    const finalStatuses = await this.postulationStatusRepository.find({
      where: finalStatusCodes.map((code) => ({ code })),
    });

    const finalStatusIds = finalStatuses.map((s) => s.id);

    // Obtener postulaciones NO finalizadas de estos proyectos
    const activePostulations = await this.postulationRepository
      .createQueryBuilder('postulation')
      .leftJoinAndSelect('postulation.project', 'project')
      .leftJoinAndSelect('postulation.status', 'status')
      .where('postulation.project_id IN (:...projectIds)', { projectIds })
      .andWhere('postulation.status_id NOT IN (:...finalStatusIds)', {
        finalStatusIds,
      })
      .getMany();

    if (activePostulations.length === 0) {
      return 0;
    }

    // Cancelar TODAS las postulaciones no finalizadas
    const result = await this.postulationRepository
      .createQueryBuilder()
      .update(Postulation)
      .set({
        statusId: cancelledStatus.id,
        cancelledByModeration: true,
        moderationCancelledAt: new Date(),
        moderationCancelReason:
          'El propietario del proyecto ha sido suspendido por infracciones graves',
      })
      .where('project_id IN (:...projectIds)', { projectIds })
      .andWhere('status_id NOT IN (:...finalStatusIds)', { finalStatusIds })
      .execute();

    // Obtener información del owner baneado
    try {
      await firstValueFrom(
        this.usersClient.send('findUserByIdWithRelations', { id: userId }),
      );

      // Enviar emails a todos los postulantes afectados
      for (const postulation of activePostulations) {
        try {
          const applicant = await firstValueFrom(
            this.usersClient.send('findUserByIdWithRelations', {
              id: postulation.userId,
            }),
          );

          if (applicant?.email) {
            const applicantName = applicant?.profile
              ? `${applicant.profile.name} ${applicant.profile.lastName}`.trim()
              : 'Usuario';

            const projectTitle = postulation.project?.title || 'Sin título';
            const wasAccepted =
              postulation.status?.code === PostulationStatusCode.ACCEPTED;

            await this.emailService.sendProjectOwnerBannedEmail(
              applicant.email,
              applicantName,
              {
                projectTitle,
                projectId: postulation.project.id,
                wasAccepted,
                reason: wasAccepted
                  ? `Tu colaboración en el proyecto "${projectTitle}" ha sido cancelada porque el propietario fue suspendido permanentemente.`
                  : `Tu postulación al proyecto "${projectTitle}" ha sido cancelada porque el propietario fue suspendido permanentemente.`,
              },
            );

            this.logger.log(
              `Email enviado al postulante ${applicant.email} (postulación ${postulation.id})`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error enviando email para postulación ${postulation.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Error obteniendo información del owner baneado:',
        error,
      );
    }

    return result.affected || 0;
  }

  /**
   * Cancela TODAS las postulaciones de un usuario (por baneo)
   */
  private async cancelAllUserPostulations(userId: number): Promise<number> {
    const cancelledStatus = await this.postulationStatusRepository.findOne({
      where: { code: PostulationStatusCode.CANCELLED_BY_MODERATION },
    });

    if (!cancelledStatus) {
      this.logger.error(
        'Estado "cancelled_by_moderation" no encontrado en la base de datos',
      );
      return 0;
    }

    // Obtener postulaciones ANTES de cancelarlas para enviar emails
    const activeStatusCodes = [
      PostulationStatusCode.ACTIVE,
      PostulationStatusCode.PENDING_EVALUATION,
      PostulationStatusCode.ACCEPTED,
    ];

    const activeStatuses = await this.postulationStatusRepository.find({
      where: activeStatusCodes.map((code) => ({ code })),
    });

    const activeStatusIds = activeStatuses.map((s) => s.id);

    const postulationsToCancel = await this.postulationRepository
      .createQueryBuilder('postulation')
      .leftJoinAndSelect('postulation.project', 'project')
      .leftJoinAndSelect('postulation.status', 'status')
      .where('postulation.user_id = :userId', { userId })
      .andWhere('postulation.status_id IN (:...activeStatusIds)', {
        activeStatusIds,
      })
      .getMany();

    // Cancelar todas las postulaciones activas
    const result = await this.postulationRepository
      .createQueryBuilder()
      .update(Postulation)
      .set({
        statusId: cancelledStatus.id,
        cancelledByModeration: true,
        moderationCancelledAt: new Date(),
        moderationCancelReason:
          'Postulación cancelada - El usuario fue baneado por violaciones graves de las políticas',
      })
      .where('user_id = :userId', { userId })
      .andWhere('status_id IN (:...activeStatusIds)', { activeStatusIds })
      .execute();

    // Obtener información del postulante baneado
    try {
      const bannedUser = await firstValueFrom(
        this.usersClient.send('findUserByIdWithRelations', { id: userId }),
      );
      const postulantName = bannedUser?.profile
        ? `${bannedUser.profile.name} ${bannedUser.profile.lastName}`.trim()
        : 'Postulante';

      // Enviar emails a los owners de los proyectos afectados
      for (const postulation of postulationsToCancel) {
        try {
          // Obtener información del owner del proyecto
          const ownerUser = await firstValueFrom(
            this.usersClient.send('findUserByIdWithRelations', {
              id: postulation.project.userId,
            }),
          );

          if (ownerUser?.email) {
            const ownerName = ownerUser?.profile
              ? `${ownerUser.profile.name} ${ownerUser.profile.lastName}`.trim()
              : 'Usuario';

            const wasAccepted =
              postulation.status?.code === PostulationStatusCode.ACCEPTED;

            await this.emailService.sendPostulantBannedEmail(
              ownerUser.email,
              ownerName,
              {
                postulantName,
                projectTitle: postulation.project.title,
                projectId: postulation.project.id,
                wasAccepted,
                reason:
                  'El postulante ha sido suspendido por infracciones graves a las políticas de la plataforma.',
              },
            );

            this.logger.log(
              `Email enviado al owner ${ownerUser.email} sobre postulación #${postulation.id}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error enviando email al owner del proyecto ${postulation.project.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Error obteniendo información del postulante baneado:',
        error,
      );
    }

    return result.affected || 0;
  }

  /**
   * Cancela solo postulaciones PENDIENTES (por suspensión)
   */
  private async cancelPendingPostulations(userId: number): Promise<number> {
    const cancelledStatus = await this.postulationStatusRepository.findOne({
      where: { code: PostulationStatusCode.CANCELLED_BY_SUSPENSION },
    });

    if (!cancelledStatus) {
      this.logger.error(
        'Estado "cancelled_by_suspension" no encontrado en la base de datos',
      );
      return 0;
    }

    // Obtener postulaciones ANTES de cancelarlas
    const pendingStatusCodes = [
      PostulationStatusCode.ACTIVE,
      PostulationStatusCode.PENDING_EVALUATION,
    ];

    const pendingStatuses = await this.postulationStatusRepository.find({
      where: pendingStatusCodes.map((code) => ({ code })),
    });

    const pendingStatusIds = pendingStatuses.map((s) => s.id);

    const pendingPostulations = await this.postulationRepository
      .createQueryBuilder('postulation')
      .leftJoinAndSelect('postulation.project', 'project')
      .where('postulation.user_id = :userId', { userId })
      .andWhere('postulation.status_id IN (:...pendingStatusIds)', {
        pendingStatusIds,
      })
      .getMany();

    // Solo cancelar postulaciones PENDIENTES (no las aceptadas)
    const result = await this.postulationRepository
      .createQueryBuilder()
      .update(Postulation)
      .set({
        statusId: cancelledStatus.id,
        cancelledByModeration: true,
        moderationCancelledAt: new Date(),
        moderationCancelReason:
          'Postulación cancelada - Usuario en suspensión temporal',
      })
      .where('user_id = :userId', { userId })
      .andWhere('status_id IN (:...pendingStatusIds)', { pendingStatusIds })
      .execute();

    // Enviar emails a los owners de las postulaciones pendientes canceladas
    try {
      const suspendedUser = await firstValueFrom(
        this.usersClient.send('findUserByIdWithRelations', { id: userId }),
      );
      const postulantName = suspendedUser?.profile
        ? `${suspendedUser.profile.name} ${suspendedUser.profile.lastName}`.trim()
        : 'Postulante';

      for (const postulation of pendingPostulations) {
        try {
          const ownerUser = await firstValueFrom(
            this.usersClient.send('findUserByIdWithRelations', {
              id: postulation.project.userId,
            }),
          );

          if (ownerUser?.email) {
            const ownerName = ownerUser?.profile
              ? `${ownerUser.profile.name} ${ownerUser.profile.lastName}`.trim()
              : 'Usuario';

            await this.emailService.sendPostulantBannedEmail(
              ownerUser.email,
              ownerName,
              {
                postulantName,
                projectTitle: postulation.project.title,
                projectId: postulation.project.id,
                wasAccepted: false,
                reason: 'El postulante está suspendido temporalmente.',
              },
            );

            this.logger.log(
              `Email de suspensión enviado al owner ${ownerUser.email} (postulación #${postulation.id})`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error enviando email al owner del proyecto ${postulation.project.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Error obteniendo información del postulante suspendido:',
        error,
      );
    }

    return result.affected || 0;
  }

  /**
   * Verifica si un usuario tiene proyectos activos propios
   */
  async checkUserOwnActiveProjects(userId: number): Promise<{
    count: number;
    details: any[];
  }> {
    const activeProjects = await this.projectRepository.find({
      where: {
        userId,
        isActive: true,
        deletedAt: IsNull(),
      },
      select: ['id', 'title', 'description', 'startDate', 'endDate'],
    });

    return {
      count: activeProjects.length,
      details: activeProjects.map((project) => ({
        projectId: project.id,
        title: project.title,
        description: project.description?.substring(0, 100) || '',
        startDate: project.startDate,
        endDate: project.endDate,
      })),
    };
  }

  /**
   * Verifica si un usuario tiene postulaciones aceptadas (colaboraciones activas)
   */
  async checkUserActiveCollaborations(userId: number): Promise<{
    count: number;
    details: any[];
  }> {
    const acceptedStatus = await this.postulationStatusRepository.findOne({
      where: { code: PostulationStatusCode.ACCEPTED },
    });

    if (!acceptedStatus) {
      return { count: 0, details: [] };
    }

    const activeCollaborations = await this.postulationRepository
      .createQueryBuilder('postulation')
      .leftJoinAndSelect('postulation.project', 'project')
      .leftJoinAndSelect('postulation.status', 'status')
      .where('postulation.user_id = :userId', { userId })
      .andWhere('postulation.status_id = :statusId', {
        statusId: acceptedStatus.id,
      })
      .andWhere('project.isActive = :isActive', { isActive: true })
      .andWhere('project.deletedAt IS NULL')
      .select([
        'postulation.id',
        'project.id',
        'project.title',
        'status.id',
        'status.name',
      ])
      .getMany();

    return {
      count: activeCollaborations.length,
      details: activeCollaborations.map((postulation) => ({
        postulationId: postulation.id,
        projectId: postulation.project?.id,
        projectTitle: postulation.project?.title || 'Sin título',
        role: 'Colaborador',
        status: postulation.status?.name || 'Aceptado',
      })),
    };
  }
}
