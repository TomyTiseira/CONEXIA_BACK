import { Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as cookie from 'cookie';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { NATS_SERVICE } from '../../config';
import { ChatbotService } from '../services/chatbot.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chatbot',
})
export class ChatbotGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatbotGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatbotService: ChatbotService,
    @Inject(NATS_SERVICE) private readonly natsClient: ClientProxy,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      // Extraer token de las cookies
      const cookies = client.handshake.headers.cookie;
      if (!cookies) {
        this.logger.warn('Client connected without cookies');
        this.sendAuthError(
          client,
          'no_cookies',
          'No se encontraron cookies de autenticación',
        );
        client.disconnect();
        return;
      }

      const parsedCookies = cookie.parse(cookies);
      const accessToken = parsedCookies['access_token'];
      const refreshToken = parsedCookies['refresh_token'];

      // Si no hay ningún token, rechazar conexión
      if (!accessToken && !refreshToken) {
        this.logger.warn('Client connected without auth tokens in cookies');
        this.sendAuthError(
          client,
          'no_tokens',
          'No se encontraron tokens de autenticación',
        );
        client.disconnect();
        return;
      }

      // Intentar autenticar con el access token
      const authResult = await this.authenticateWithToken(
        client,
        accessToken,
        refreshToken,
      );

      if (!authResult.success) {
        this.sendAuthError(
          client,
          authResult.code || 'authentication_failed',
          authResult.reason || 'Error de autenticación',
        );
        client.disconnect();
        return;
      }

      // Autenticación exitosa
      client.userId = authResult.userId;
      this.logger.log(`User ${client.userId} connected to chatbot`);

      // Notificar al cliente sobre la conexión exitosa
      client.emit('connected', {
        userId: client.userId,
        message: 'Conectado exitosamente al chatbot',
        tokenRefreshed: authResult.tokenRefreshed || false,
      });
    } catch (error) {
      this.logger.error('WebSocket authentication error:', error);
      this.sendAuthError(
        client,
        'server_error',
        'Error interno del servidor durante la autenticación',
      );
      client.disconnect();
    }
  }

  /**
   * Intenta autenticar al cliente con el access token.
   * Si falla y hay refresh token, intenta renovar automáticamente.
   */
  private async authenticateWithToken(
    client: AuthenticatedSocket,
    accessToken: string | undefined,
    refreshToken: string | undefined,
  ): Promise<{
    success: boolean;
    userId?: number;
    tokenRefreshed?: boolean;
    code?: string;
    reason?: string;
  }> {
    // Intentar con el access token si existe
    if (accessToken) {
      try {
        const payload = this.jwtService.verify(accessToken, {
          ignoreExpiration: false, // Verificar expiración explícitamente
        });
        if (payload?.sub) {
          return {
            success: true,
            userId: payload.sub as number,
            tokenRefreshed: false,
          };
        }
      } catch (error) {
        // Si el token expiró, intentar refresh automático
        if (
          error instanceof Error &&
          error.name === 'TokenExpiredError' &&
          refreshToken
        ) {
          this.logger.log('Access token expired, attempting automatic refresh');
          return await this.attemptTokenRefresh(client, refreshToken);
        }

        // Otro tipo de error con el token
        this.logger.warn(`Token verification failed: ${error}`);
        return {
          success: false,
          code: 'invalid_token',
          reason: 'Token de acceso inválido',
        };
      }
    }

    // Si no hay access token pero hay refresh token, intentar obtener uno nuevo
    if (refreshToken) {
      this.logger.log('No access token, attempting refresh');
      return await this.attemptTokenRefresh(client, refreshToken);
    }

    // No hay tokens válidos
    return {
      success: false,
      code: 'no_valid_tokens',
      reason: 'No se encontraron tokens válidos',
    };
  }

  /**
   * Intenta renovar el access token usando el refresh token
   */
  private async attemptTokenRefresh(
    client: AuthenticatedSocket,
    refreshToken: string,
  ): Promise<{
    success: boolean;
    userId?: number;
    tokenRefreshed?: boolean;
    code?: string;
    reason?: string;
  }> {
    try {
      // Llamar al microservicio de usuarios para refrescar el token
      const refreshResult = await firstValueFrom(
        this.natsClient.send('refreshToken', { refreshToken }).pipe(
          timeout(5000), // Timeout de 5 segundos
          catchError((error) => {
            this.logger.error('NATS refresh token request failed:', error);
            throw error;
          }),
        ),
      );

      // Verificar la respuesta del microservicio
      if (
        !refreshResult ||
        !refreshResult.success ||
        !refreshResult.data?.accessToken
      ) {
        this.logger.warn('Refresh token request returned invalid response');
        return {
          success: false,
          code: 'refresh_failed',
          reason: 'No se pudo renovar el token',
        };
      }

      const newAccessToken = refreshResult.data.accessToken;
      const expiresIn = refreshResult.data.expiresIn || 3600;

      // Verificar el nuevo token
      const payload = this.jwtService.verify(newAccessToken, {
        ignoreExpiration: false,
      });
      if (!payload?.sub) {
        this.logger.warn('New access token is invalid');
        return {
          success: false,
          code: 'invalid_refreshed_token',
          reason: 'El token renovado es inválido',
        };
      }

      // Emitir el nuevo token al cliente para que actualice sus cookies
      client.emit('token_refreshed', {
        accessToken: newAccessToken,
        expiresIn,
        message: 'Token renovado automáticamente',
      });

      this.logger.log(
        `Token refreshed successfully for user ${payload.sub as number}`,
      );

      return {
        success: true,
        userId: payload.sub as number,
        tokenRefreshed: true,
      };
    } catch (error) {
      this.logger.error('Failed to refresh token:', error);

      // Determinar el tipo de error
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          return {
            success: false,
            code: 'refresh_timeout',
            reason: 'Timeout al renovar el token',
          };
        }
        if (error.message.includes('expired')) {
          return {
            success: false,
            code: 'refresh_token_expired',
            reason: 'El refresh token ha expirado',
          };
        }
      }

      return {
        success: false,
        code: 'refresh_error',
        reason: 'Error al renovar el token',
      };
    }
  }

  /**
   * Envía un error de autenticación al cliente
   */
  private sendAuthError(
    client: AuthenticatedSocket,
    code: string,
    message: string,
  ): void {
    client.emit('auth_error', {
      code,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`User ${client.userId} disconnected from chatbot`);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return client.emit('error', { message: 'Usuario no autenticado' });
    }

    this.logger.log(
      `Message received from user ${client.userId}: ${data.message}`,
    );

    try {
      const result = await this.chatbotService.sendMessage(
        client.userId,
        data.message,
      );

      client.emit('assistantMessage', {
        message: result.response,
        conversationId: result.conversationId,
      });
    } catch (error) {
      this.logger.error('Error processing message:', error);
      client.emit('error', { message: 'Error al procesar tu mensaje' });
    }
  }
}
