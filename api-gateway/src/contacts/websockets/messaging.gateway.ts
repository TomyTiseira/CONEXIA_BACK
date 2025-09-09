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

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/messaging',
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private connectedUsers = new Map<number, string>(); // userId -> socketId

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      // Extraer token de las cookies
      const cookies = client.handshake.headers.cookie;
      if (!cookies) {
        this.logger.warn('client connected without cookies');
        client.disconnect();
        return;
      }

      const parsedCookies = cookie.parse(cookies);
      const token = parsedCookies['access_token'] || parsedCookies['jwt'];

      if (!token) {
        this.logger.warn('client connected without auth token in cookies');
        client.disconnect();
        return;
      }

      // Verificar y decodificar el token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;

      if (!client.userId) {
        this.logger.warn('invalid token: userId not found');
        client.disconnect();
        return;
      }

      // Guardar la conexión del usuario
      this.connectedUsers.set(client.userId, client.id);

      // Notificar que el usuario está en línea (solo a usuarios conectados)
      client.broadcast.emit('userOnline', { userId: client.userId });

      this.logger.log(`user ${client.userId} connected for 1-to-1 chat`);
    } catch (error) {
      this.logger.error('WebSocket authentication error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      client.broadcast.emit('userOffline', { userId: client.userId });
      this.logger.log(`user ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: number; otherUserId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    // Para chat 1 a 1, crear una sala única basada en los IDs de los usuarios
    const roomName = this.getConversationRoomName(
      client.userId,
      data.otherUserId,
    );
    void client.join(roomName);

    this.logger.log(
      `user ${client.userId} joined 1-to-1 conversation with user ${data.otherUserId}`,
    );
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: number; otherUserId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const roomName = this.getConversationRoomName(
      client.userId,
      data.otherUserId,
    );
    void client.leave(roomName);

    this.logger.log(
      `user ${client.userId} left 1-to-1 conversation with user ${data.otherUserId}`,
    );
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @MessageBody()
    data: {
      conversationId: number;
      receiverId: number;
      type: 'text' | 'image' | 'pdf';
      content: string;
      fileName?: string;
      fileSize?: number;
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const messageData = {
      id: Date.now(), // ID temporal
      conversationId: data.conversationId,
      senderId: client.userId,
      receiverId: data.receiverId,
      type: data.type,
      content: data.content,
      fileName: data.fileName,
      fileSize: data.fileSize,
      timestamp: new Date(),
      isRead: false,
    };

    // Para chat 1 a 1, enviar mensaje a la sala específica de la conversación
    const roomName = this.getConversationRoomName(
      client.userId,
      data.receiverId,
    );
    this.server.to(roomName).emit('newMessage', messageData);

    // Enviar notificación al receptor si no está en la sala
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId && !client.rooms.has(roomName)) {
      this.server.to(receiverSocketId).emit('messageNotification', {
        conversationId: data.conversationId,
        senderId: client.userId,
        message:
          data.type === 'text' ? data.content : `Archivo: ${data.fileName}`,
      });
    }

    this.logger.log(
      `1-to-1 message sent from user ${client.userId} to user ${data.receiverId}`,
    );
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody()
    data: { conversationId: number; otherUserId: number; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const roomName = this.getConversationRoomName(
      client.userId,
      data.otherUserId,
    );
    client.to(roomName).emit('userTyping', {
      userId: client.userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('markAsRead')
  handleMarkAsRead(
    @MessageBody()
    data: {
      conversationId: number;
      otherUserId: number;
      messageIds: number[];
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const roomName = this.getConversationRoomName(
      client.userId,
      data.otherUserId,
    );
    // Notificar al otro usuario que los mensajes fueron leídos
    client.to(roomName).emit('messagesRead', {
      userId: client.userId,
      conversationId: data.conversationId,
      messageIds: data.messageIds,
    });

    this.logger.log(
      `messages marked as read in 1-to-1 conversation ${data.conversationId} by user ${client.userId}`,
    );
  }

  // Método para generar nombre único de sala para chat 1 a 1
  private getConversationRoomName(userId1: number, userId2: number): string {
    // Ordenar los IDs para asegurar que la sala sea la misma independientemente del orden
    const [minId, maxId] = [userId1, userId2].sort((a, b) => a - b);
    return `chat_${minId}_${maxId}`;
  }

  // Método para enviar mensaje desde el backend a una conversación 1 a 1
  sendMessageToConversation(
    senderId: number,
    receiverId: number,
    message: any,
  ) {
    const roomName = this.getConversationRoomName(senderId, receiverId);
    this.server.to(roomName).emit('newMessage', message);
  }

  // Método para verificar si un usuario está en línea
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  // Método para obtener socket de un usuario
  getUserSocket(userId: number): string | undefined {
    return this.connectedUsers.get(userId);
  }

  // Método para enviar notificación a un usuario específico
  sendNotificationToUser(userId: number, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }

  // Método para obtener usuarios conectados (útil para mostrar estado en línea)
  getConnectedUsers(): number[] {
    return Array.from(this.connectedUsers.keys());
  }
}
