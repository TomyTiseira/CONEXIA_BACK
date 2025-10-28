/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
import { Server, Socket } from 'socket.io';
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
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      // Extraer token de las cookies
      const cookies = client.handshake.headers.cookie;
      if (!cookies) {
        this.logger.warn('Client connected without cookies');
        client.disconnect();
        return;
      }

      const parsedCookies = cookie.parse(cookies);
      const token = parsedCookies['access_token'] || parsedCookies['jwt'];

      if (!token) {
        this.logger.warn('Client connected without auth token in cookies');
        client.disconnect();
        return;
      }

      // Verificar y decodificar el token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;

      if (!client.userId) {
        this.logger.warn('Invalid token: userId not found');
        client.disconnect();
        return;
      }

      this.logger.log(`User ${client.userId} connected to chatbot`);
    } catch (error) {
      this.logger.error('WebSocket authentication error:', error);
      client.disconnect();
    }
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
