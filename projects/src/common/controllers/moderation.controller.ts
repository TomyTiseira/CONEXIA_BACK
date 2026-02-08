import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ModerationListenerService } from '../services/moderation-listener.service';

@Controller()
export class ModerationController {
  private readonly logger = new Logger(ModerationController.name);

  constructor(
    private readonly moderationListenerService: ModerationListenerService,
  ) {}

  /**
   * Escucha el evento de usuario baneado
   */
  @EventPattern('user.banned')
  async handleUserBanned(
    @Payload() data: { userId: number; bannedAt: Date; reason: string },
  ): Promise<void> {
    this.logger.log(`Evento recibido: usuario ${data.userId} baneado`);
    await this.moderationListenerService.handleUserBanned(data.userId);
  }

  /**
   * Escucha el evento de usuario suspendido
   */
  @EventPattern('user.suspended')
  async handleUserSuspended(
    @Payload()
    data: {
      userId: number;
      suspendedAt: Date;
      expiresAt: Date;
      reason: string;
    },
  ): Promise<void> {
    this.logger.log(
      `Evento recibido: usuario ${data.userId} suspendido hasta ${data.expiresAt}`,
    );
    await this.moderationListenerService.handleUserSuspended(data.userId);
  }

  /**
   * Escucha el evento de usuario reactivado
   */
  @EventPattern('user.reactivated')
  async handleUserReactivated(
    @Payload() data: { userId: number; reactivatedAt: Date },
  ): Promise<void> {
    this.logger.log(`Evento recibido: usuario ${data.userId} reactivado`);
    await this.moderationListenerService.handleUserReactivated(data.userId);
  }

  /**
   * Responde a consultas sobre proyectos activos propios del usuario
   */
  @MessagePattern('checkUserOwnActiveProjects')
  async checkUserOwnActiveProjects(
    @Payload() data: { userId: number },
  ): Promise<{
    count: number;
    details: any[];
  }> {
    this.logger.log(
      `Consulta recibida: verificar proyectos activos de usuario ${data.userId}`,
    );
    return this.moderationListenerService.checkUserOwnActiveProjects(
      data.userId,
    );
  }

  /**
   * Responde a consultas sobre colaboraciones activas del usuario (postulaciones aceptadas)
   */
  @MessagePattern('checkUserActiveCollaborations')
  async checkUserActiveCollaborations(
    @Payload() data: { userId: number },
  ): Promise<{
    count: number;
    details: any[];
  }> {
    this.logger.log(
      `Consulta recibida: verificar colaboraciones activas de usuario ${data.userId}`,
    );
    return this.moderationListenerService.checkUserActiveCollaborations(
      data.userId,
    );
  }
}
