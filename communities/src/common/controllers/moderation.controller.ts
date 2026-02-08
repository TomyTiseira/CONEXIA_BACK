import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ModerationListenerService } from '../services/moderation-listener.service';

/**
 * Controlador que escucha eventos NATS de moderación de usuarios
 * y actualiza el estado de las publicaciones correspondientes
 */
@Controller()
export class ModerationController {
  private readonly logger = new Logger(ModerationController.name);

  constructor(
    private readonly moderationListenerService: ModerationListenerService,
  ) {}

  /**
   * Evento: Usuario baneado
   * Marca todas las publicaciones del usuario con ownerModerationStatus = 'banned'
   */
  @EventPattern('user.banned')
  async handleUserBanned(
    @Payload() data: { userId: number; moderationStatus: string },
  ) {
    this.logger.log(`Evento recibido: usuario ${data.userId} baneado`);
    try {
      await this.moderationListenerService.handleUserBanned(
        data.userId,
        data.moderationStatus,
      );
    } catch (error) {
      this.logger.error(`Error manejando evento user.banned:`, error);
    }
  }

  /**
   * Evento: Usuario suspendido
   * Marca todas las publicaciones del usuario con ownerModerationStatus = 'suspended'
   */
  @EventPattern('user.suspended')
  async handleUserSuspended(
    @Payload() data: { userId: number; moderationStatus: string },
  ) {
    this.logger.log(`Evento recibido: usuario ${data.userId} suspendido`);
    try {
      await this.moderationListenerService.handleUserSuspended(data.userId);
    } catch (error) {
      this.logger.error(`Error manejando evento user.suspended:`, error);
    }
  }

  /**
   * Evento: Usuario reactivado
   * Limpia ownerModerationStatus de las publicaciones del usuario
   */
  @EventPattern('user.reactivated')
  async handleUserReactivated(@Payload() data: { userId: number }) {
    this.logger.log(`Evento recibido: usuario ${data.userId} reactivado`);
    try {
      await this.moderationListenerService.handleUserReactivated(data.userId);
    } catch (error) {
      this.logger.error(`Error manejando evento user.reactivated:`, error);
    }
  }
}
