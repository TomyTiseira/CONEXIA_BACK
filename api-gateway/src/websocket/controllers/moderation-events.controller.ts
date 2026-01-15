import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AuthEventsGateway } from '../gateways/auth-events.gateway';

/**
 * Controlador que escucha eventos NATS de moderación
 * y los reenvía al WebSocket Gateway para notificar clientes
 */
@Controller()
export class ModerationEventsController {
  private readonly logger = new Logger(ModerationEventsController.name);

  constructor(private readonly authEventsGateway: AuthEventsGateway) {}

  @EventPattern('user.suspended')
  handleUserSuspended(
    @Payload() data: { userId: number; reason: string; expiresAt: Date },
  ) {
    this.logger.warn(
      `🔔 EVENTO NATS RECIBIDO: user.suspended - Usuario ${data.userId}`,
    );
    this.logger.warn(`📋 Datos del evento: ${JSON.stringify(data)}`);

    this.authEventsGateway.notifyUserAccountChange(data.userId, {
      type: 'ACCOUNT_SUSPENDED',
      reason: data.reason,
      expiresAt: data.expiresAt,
      message: 'Tu cuenta ha sido suspendida',
    });

    this.logger.warn(`✅ Procesamiento del evento user.suspended completado`);
  }

  @EventPattern('user.banned')
  handleUserBanned(@Payload() data: { userId: number; reason: string }) {
    this.logger.warn(
      `🔔 EVENTO NATS RECIBIDO: user.banned - Usuario ${data.userId}`,
    );
    this.logger.warn(`📋 Datos del evento: ${JSON.stringify(data)}`);

    this.authEventsGateway.notifyUserAccountChange(data.userId, {
      type: 'ACCOUNT_BANNED',
      reason: data.reason,
      message: 'Tu cuenta ha sido baneada permanentemente',
    });

    this.logger.warn(`✅ Procesamiento del evento user.banned completado`);
  }

  @EventPattern('user.reactivated')
  handleUserReactivated(@Payload() data: { userId: number }) {
    this.logger.warn(
      `🔔 EVENTO NATS RECIBIDO: user.reactivated - Usuario ${data.userId}`,
    );
    this.logger.warn(`📋 Datos del evento: ${JSON.stringify(data)}`);

    this.authEventsGateway.notifyUserAccountChange(data.userId, {
      type: 'ACCOUNT_REACTIVATED',
      message: 'Tu cuenta ha sido reactivada',
    });

    this.logger.warn(`✅ Procesamiento del evento user.reactivated completado`);
  }
}
