import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ModerationEventsController } from './controllers/moderation-events.controller';
import { AuthEventsGateway } from './gateways/auth-events.gateway';

/**
 * Módulo para gestionar conexiones WebSocket y eventos de moderación
 * Proporciona notificaciones en tiempo real sobre cambios de estado de cuenta
 */
@Module({
  imports: [
    // JWT para autenticar conexiones WebSocket
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [ModerationEventsController], // Escucha eventos NATS
  providers: [AuthEventsGateway], // Gateway WebSocket
  exports: [AuthEventsGateway],
})
export class WebSocketModule {}
