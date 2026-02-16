import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as cookie from 'cookie';
import { Server, Socket } from 'socket.io';

/**
 * Gateway de WebSocket para notificaciones de cambios en el estado de cuenta
 * Escucha eventos de moderación (suspensión, baneo, reactivación)
 * y notifica en tiempo real a los clientes conectados
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Ajusta según tus necesidades de seguridad
    credentials: true,
  },
  namespace: '/auth-events',
})
export class AuthEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AuthEventsGateway.name);

  // Mapa de userId -> Set de socketIds (permite múltiples pestañas/dispositivos)
  private connectedUsers: Map<number, Set<string>> = new Map();

  // Buffer simple: si el usuario no está conectado al momento del evento,
  // guardamos la última notificación para enviarla al reconectar.
  private pendingAccountNotifications: Map<number, any> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway inicializado en namespace /auth-events');
  }

  handleConnection(client: Socket) {
    try {
      // ✅ EXTRAER TOKEN DE LAS COOKIES (igual que MessagingGateway)
      const cookies = client.handshake.headers.cookie;

      if (!cookies) {
        client.disconnect();
        return;
      }

      // Parsear cookies y extraer access_token
      const parsedCookies = cookie.parse(cookies) as Record<string, string>;
      const token = parsedCookies['access_token'] || parsedCookies['jwt'];

      if (!token) {
        client.disconnect();
        return;
      }

      // Verificar y decodificar token
      let payload: { sub: number };
      try {
        payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'your-secret-key',
        });
      } catch {
        // Error de verificación del token
        client.disconnect();
        return;
      }

      const userId = payload.sub;

      if (!userId) {
        client.disconnect();
        return;
      }

      // Registrar conexión del usuario
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.add(client.id);
      }

      // Unir al cliente a una room con su userId (para envío dirigido)
      void client.join(`user-${userId}`);

      // Guardar userId en el socket para acceso posterior
      (client.data as Record<string, any>).userId = userId;

      const pending: any = this.pendingAccountNotifications.get(userId);
      if (pending) {
        this.server
          .to(`user-${userId}`)
          .emit('account-status-changed', pending);
        this.pendingAccountNotifications.delete(userId);
      }
    } catch (error: unknown) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as { userId?: number }).userId;

    if (userId) {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);

        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
    }
  }

  /**
   * Enviar notificación a todas las sesiones activas de un usuario
   * Método público llamado por ModerationEventsController
   */
  public notifyUserAccountChange(userId: number, payload: any) {
    const userSockets = this.connectedUsers.get(userId);

    if (userSockets && userSockets.size > 0) {
      // Enviar a todas las sesiones del usuario (múltiples pestañas/dispositivos)
      this.server.to(`user-${userId}`).emit('account-status-changed', payload);
    } else {
      // Guardar para enviar cuando el usuario se conecte/reconecte.
      this.pendingAccountNotifications.set(userId, payload);
    }
  }

  /**
   * Método para obtener estadísticas de conexiones (útil para debugging)
   */
  getConnectionStats() {
    return {
      totalUsers: this.connectedUsers.size,
      totalSockets: Array.from(this.connectedUsers.values()).reduce(
        (sum, sockets) => sum + sockets.size,
        0,
      ),
      users: Array.from(this.connectedUsers.entries()).map(
        ([userId, sockets]) => ({
          userId,
          connections: sockets.size,
        }),
      ),
    };
  }
}
