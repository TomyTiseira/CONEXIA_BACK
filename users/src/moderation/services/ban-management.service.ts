import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { EmailService } from 'src/common/services/email.service';
import { AccountStatus, User } from 'src/shared/entities/user.entity';
import { LessThanOrEqual, Repository } from 'typeorm';
import { NATS_SERVICE } from '../config';
import { ModerationAction } from '../entities/moderation-action.entity';

@Injectable()
export class BanManagementService {
  private readonly logger = new Logger(BanManagementService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ModerationAction)
    private readonly moderationActionRepository: Repository<ModerationAction>,
    @Inject(NATS_SERVICE)
    private readonly natsClient: ClientProxy,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Cron job que se ejecuta todos los días a las 2 AM
   * Reactiva usuarios cuya suspensión expiró
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processExpiredSuspensions() {
    this.logger.log(
      'Iniciando proceso de reactivación de suspensiones expiradas...',
    );

    try {
      // Buscar usuarios suspendidos cuya fecha de expiración es hoy o anterior
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Hasta el final del día

      const expiredSuspensions = await this.userRepository.find({
        where: {
          accountStatus: AccountStatus.SUSPENDED,
          suspensionExpiresAt: LessThanOrEqual(today),
        },
        relations: ['profile'],
      });

      this.logger.log(
        `Se encontraron ${expiredSuspensions.length} suspensiones para reactivar`,
      );

      for (const user of expiredSuspensions) {
        try {
          await this.reactivateUser(user);
          this.logger.log(`Usuario ${user.id} reactivado exitosamente`);
        } catch (error) {
          this.logger.error(`Error al reactivar usuario ${user.id}:`, error);
        }
      }

      this.logger.log('Proceso de reactivación completado');
    } catch (error) {
      this.logger.error('Error en proceso de reactivación:', error);
    }
  }

  /**
   * Reactiva un usuario suspendido
   */
  private async reactivateUser(user: User): Promise<void> {
    // Actualizar estado del usuario e invalidar tokens JWT antiguos
    await this.userRepository.update(user.id, {
      accountStatus: AccountStatus.ACTIVE,
      suspendedAt: null,
      suspensionExpiresAt: null,
      suspensionReason: null,
      suspensionDays: null,
      suspendedBy: null,
      tokensInvalidatedAt: new Date(), // Invalidar sesiones con cuenta suspendida
    });

    // Registrar acción en auditoría
    await this.moderationActionRepository.save({
      userId: user.id,
      actionType: 'reactivated',
      moderatorId: null, // Acción automática
      reason: 'Suspensión temporal expirada',
      analysisId: null,
      metadata: {
        is_automatic_reactivation: true,
      },
    });

    // Emitir evento para restaurar visibilidad
    await firstValueFrom(
      this.natsClient.emit('user.reactivated', { userId: user.id }),
    );

    // Enviar email de reactivación
    await this.emailService.sendAccountReactivatedEmail(
      user.email,
      user.profile?.name || 'Usuario',
    );

    this.logger.log(`Usuario ${user.id} reactivado y notificado por email`);
  }

  /**
   * Banea un usuario
   */
  async banUser(
    userId: number,
    moderatorId: number,
    reason: string,
    analysisId: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }

    if (user.accountStatus === AccountStatus.BANNED) {
      throw new Error('El usuario ya está baneado');
    }

    // Obtener compromisos activos
    const commitments = await this.checkActiveCommitments(userId);

    // Actualizar usuario a baneado (NO invalidamos tokens para permitir que el WebSocket envíe el evento)
    await this.userRepository.update(userId, {
      accountStatus: AccountStatus.BANNED,
      bannedAt: new Date(),
      bannedBy: moderatorId,
      banReason: reason,
      // tokensInvalidatedAt NO se actualiza aquí - el frontend manejará el cierre de sesión
    });

    // Registrar en auditoría
    await this.moderationActionRepository.save({
      userId,
      actionType: 'banned',
      moderatorId,
      reason,
      analysisId,
      metadata: {
        commitments_at_time: {
          services: commitments.services.length,
          own_projects: commitments.ownProjects.length,
          collaborations: commitments.collaborations.length,
        },
      },
    });

    // Notificar a microservicios (esto emite el evento WebSocket PRIMERO)
    await this.notifyBan(userId, reason);

    // Soft-delete de contenido
    await this.softDeleteUserContent(userId);

    // NO invalidamos sesiones aquí - el frontend cerrará la sesión después del modal
    // await this.invalidateUserSessions(userId);

    // Enviar email al usuario baneado
    await this.emailService.sendAccountBannedEmail(
      user.email,
      user.profile?.name || 'Usuario',
      reason,
    );

    // Notificar a usuarios afectados
    this.notifyAffectedUsers();

    this.logger.log(`Usuario ${userId} baneado exitosamente`);
  }

  /**
   * Suspende un usuario temporalmente
   */
  async suspendUser(
    userId: number,
    moderatorId: number,
    reason: string,
    days: number,
    analysisId: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }

    if (user.accountStatus === AccountStatus.BANNED) {
      throw new Error('El usuario está baneado, no puede ser suspendido');
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new Error('El usuario ya está suspendido');
    }

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Obtener compromisos activos
    const commitments = await this.checkActiveCommitments(userId);

    // Actualizar usuario a suspendido (NO invalidamos tokens para permitir que el WebSocket envíe el evento)
    await this.userRepository.update(userId, {
      accountStatus: AccountStatus.SUSPENDED,
      suspendedAt: new Date(),
      suspensionExpiresAt: expiresAt,
      suspensionReason: reason,
      suspensionDays: days,
      suspendedBy: moderatorId,
      // tokensInvalidatedAt NO se actualiza aquí - el frontend manejará el cierre de sesión después del modal
    });

    // Registrar en auditoría
    await this.moderationActionRepository.save({
      userId,
      actionType: 'suspended',
      moderatorId,
      reason,
      analysisId,
      metadata: {
        commitments_at_time: {
          services: commitments.services.length,
          own_projects: commitments.ownProjects.length,
          collaborations: commitments.collaborations.length,
        },
        suspension_days: days,
        suspension_expires_at: expiresAt.toISOString(),
      },
    });

    // Notificar a microservicios
    await this.notifySuspension(userId, reason, expiresAt);

    // Ocultar contenido públicamente (pero no eliminarlo)
    await this.hideUserContent(userId);

    // Enviar email al usuario suspendido
    await this.emailService.sendAccountSuspendedEmail(
      user.email,
      user.profile?.name || 'Usuario',
      reason,
      days,
      expiresAt,
      commitments,
    );

    // Notificar a owners sobre postulaciones canceladas
    this.notifyPostulationsCancelled();

    this.logger.log(`Usuario ${userId} suspendido por ${days} días`);
  }

  /**
   * Verifica compromisos activos del usuario
   */
  private async checkActiveCommitments(userId: number) {
    try {
      const [services, ownProjects, collaborations] = await Promise.allSettled([
        firstValueFrom(
          this.natsClient.send('checkUserActiveHirings', { userId }),
        ),
        firstValueFrom(
          this.natsClient.send('checkUserOwnActiveProjects', { userId }),
        ),
        firstValueFrom(
          this.natsClient.send('checkUserActiveCollaborations', { userId }),
        ),
      ]);

      return {
        services:
          services.status === 'fulfilled'
            ? (services.value as { details?: any[] })?.details || []
            : [],
        ownProjects:
          ownProjects.status === 'fulfilled'
            ? (ownProjects.value as { details?: any[] })?.details || []
            : [],
        collaborations:
          collaborations.status === 'fulfilled'
            ? (collaborations.value as { details?: any[] })?.details || []
            : [],
      };
    } catch (error) {
      this.logger.error('Error verificando compromisos activos:', error);
      return {
        services: [],
        ownProjects: [],
        collaborations: [],
      };
    }
  }

  /**
   * Notifica a microservicios sobre el baneo
   */
  private async notifyBan(userId: number, reason?: string): Promise<void> {
    try {
      // Emitir evento para actualizar ownerModerationStatus a 'banned'
      await firstValueFrom(
        this.natsClient.emit('user.banned', {
          userId,
          moderationStatus: 'banned',
          reason: reason || 'Violación de términos y condiciones',
        }),
      );
      this.logger.log(`Evento user.banned emitido para usuario ${userId}`);
    } catch (error) {
      this.logger.error('Error emitiendo evento user.banned:', error);
    }
  }

  /**
   * Notifica a microservicios sobre la suspensión
   */
  private async notifySuspension(
    userId: number,
    reason?: string,
    expiresAt?: Date,
  ): Promise<void> {
    try {
      // Emitir evento para actualizar ownerModerationStatus a 'suspended'
      await firstValueFrom(
        this.natsClient.emit('user.suspended', {
          userId,
          moderationStatus: 'suspended',
          reason: reason || 'Suspensión temporal',
          expiresAt: expiresAt,
        }),
      );
      this.logger.log(`Evento user.suspended emitido para usuario ${userId}`);
    } catch (error) {
      this.logger.error('Error emitiendo evento user.suspended:', error);
    }
  }

  /**
   * Soft-delete de todo el contenido del usuario
   */
  private async softDeleteUserContent(userId: number): Promise<void> {
    try {
      // Emitir eventos para soft-delete en cada microservicio
      await Promise.allSettled([
        firstValueFrom(
          this.natsClient.emit('user.content.softDelete', {
            userId,
            source: 'services',
          }),
        ),
        firstValueFrom(
          this.natsClient.emit('user.content.softDelete', {
            userId,
            source: 'projects',
          }),
        ),
        firstValueFrom(
          this.natsClient.emit('user.content.softDelete', {
            userId,
            source: 'communities',
          }),
        ),
      ]);

      this.logger.log(
        `Contenido del usuario ${userId} eliminado (soft-delete)`,
      );
    } catch (error) {
      this.logger.error('Error en soft-delete de contenido:', error);
    }
  }

  /**
   * Oculta contenido del usuario (para suspensiones)
   */
  private async hideUserContent(userId: number): Promise<void> {
    try {
      await Promise.allSettled([
        firstValueFrom(
          this.natsClient.emit('user.content.hide', {
            userId,
            source: 'services',
          }),
        ),
        firstValueFrom(
          this.natsClient.emit('user.content.hide', {
            userId,
            source: 'projects',
          }),
        ),
        firstValueFrom(
          this.natsClient.emit('user.content.hide', {
            userId,
            source: 'communities',
          }),
        ),
      ]);

      this.logger.log(`Contenido del usuario ${userId} ocultado`);
    } catch (error) {
      this.logger.error('Error ocultando contenido:', error);
    }
  }

  /**
   * Invalida todas las sesiones activas del usuario
   */
  private async invalidateUserSessions(userId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.natsClient.emit('user.sessions.invalidate', { userId }),
      );
      this.logger.log(`Sesiones del usuario ${userId} invalidadas`);
    } catch (error) {
      this.logger.error('Error invalidando sesiones:', error);
    }
  }

  /**
   * Notifica a usuarios afectados por el baneo
   */
  private notifyAffectedUsers(): void {
    // Esta lógica se maneja dentro de cada microservicio cuando reciben el evento de baneo
    this.logger.log(
      `Notificaciones a usuarios afectados delegadas a microservicios`,
    );
  }

  /**
   * Notifica cancelación de postulaciones por suspensión
   */
  private notifyPostulationsCancelled(): void {
    // Esta lógica se maneja en el microservicio de projects
    this.logger.log(
      `Notificaciones de postulaciones canceladas delegadas a microservicio de projects`,
    );
  }
}
