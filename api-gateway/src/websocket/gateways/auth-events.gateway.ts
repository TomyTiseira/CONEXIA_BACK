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

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway inicializado en namespace /auth-events');
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.debug(`🔌 Intento de conexión - Socket ID: ${client.id}`);

      // ✅ EXTRAER TOKEN DE LAS COOKIES (igual que MessagingGateway)
      const cookies = client.handshake.headers.cookie;

      if (!cookies) {
        this.logger.warn(
          `❌ Conexión rechazada - sin cookies (socket: ${client.id})`,
        );
        client.disconnect();
        return;
      }

      this.logger.debug(`🍪 Cookies recibidas: ${cookies.substring(0, 50)}...`);

      // Parsear cookies y extraer access_token
      const parsedCookies = cookie.parse(cookies);
      const token = parsedCookies['access_token'] || parsedCookies['jwt'];

      if (!token) {
        this.logger.warn(
          `❌ Conexión rechazada - sin token en cookies (socket: ${client.id})`,
        );
        client.disconnect();
        return;
      }

      this.logger.debug(
        `🔑 Token extraído de cookies (primeros 20 chars): ${token.substring(0, 20)}...`,
      );

      // Verificar y decodificar token
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });
      const userId = payload.sub;

      this.logger.debug(`🔓 Token decodificado - userId: ${userId}`);

      if (!userId) {
        this.logger.warn(
          `❌ Conexión rechazada - token sin userId (socket: ${client.id})`,
        );
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
      client.join(`user-${userId}`);

      // Guardar userId en el socket para acceso posterior
      client.data.userId = userId;

      this.logger.log(
        `✅ Usuario ${userId} conectado exitosamente (socket: ${client.id}, total conexiones: ${userSockets?.size || 1})`,
      );

      this.logger.debug(
        `📊 Usuarios conectados actualmente: ${this.connectedUsers.size}`,
      );
    } catch (error) {
      this.logger.error(
        `Error en autenticación WebSocket (socket: ${client.id}): ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);

        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
          this.logger.log(
            `Usuario ${userId} desconectado completamente (socket: ${client.id})`,
          );
        } else {
          this.logger.log(
            `Socket ${client.id} desconectado, usuario ${userId} aún tiene ${userSockets.size} conexión(es) activa(s)`,
          );
        }
      }
    }
  }

  /**
   * Enviar notificación a todas las sesiones activas de un usuario
   * Método público llamado por ModerationEventsController
   */
  public notifyUserAccountChange(userId: number, payload: any) {
    this.logger.warn(
      `🚨 INTENTANDO NOTIFICAR a usuario ${userId} - Tipo: ${payload.type}`,
    );

    const userSockets = this.connectedUsers.get(userId);
    this.logger.debug(
      `🔍 Conexiones del usuario ${userId}: ${userSockets?.size || 0}`,
    );

    if (userSockets && userSockets.size > 0) {
      // Enviar a todas las sesiones del usuario (múltiples pestañas/dispositivos)
      this.server.to(`user-${userId}`).emit('account-status-changed', payload);

      this.logger.warn(
        `📤 NOTIFICACIÓN ENVIADA a usuario ${userId} (${userSockets.size} sesión(es) activa(s))`,
      );
      this.logger.warn(`📦 Payload enviado: ${JSON.stringify(payload)}`);
    } else {
      this.logger.warn(
        `⚠️ Usuario ${userId} NO tiene conexiones WebSocket activas - se aplicará tokensInvalidatedAt en próxima petición HTTP`,
      );
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
