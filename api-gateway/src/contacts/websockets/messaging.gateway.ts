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
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
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
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    try {
      let fileUrl: string | undefined;
      let processedFileName: string | undefined;
      let processedFileSize: number | undefined;

      if (data.type !== 'text' && data.content) {
        const base64Match = data.content.match(/^data:([^;]+);base64,(.+)$/);

        if (base64Match) {
          const mimeType = base64Match[1];
          const fileData = base64Match[2];

          // Generar nombre de archivo
          const extension =
            data.type === 'image'
              ? mimeType.includes('png')
                ? '.png'
                : '.jpg'
              : '.pdf';
          const fileName = `file_${Date.now()}${extension}`;

          // Calcula la carpeta
          const folder = mimeType.startsWith('image/')
            ? join(process.cwd(), 'uploads', 'messages', 'images')
            : join(process.cwd(), 'uploads', 'messages', 'pdfs');
          if (!existsSync(folder)) {
            mkdirSync(folder, { recursive: true });
          }
          const filePath = join(folder, fileName);
          // Escribe el archivo
          const buffer = Buffer.from(fileData, 'base64');
          writeFileSync(filePath, buffer);

          // URL pública igual que en REST
          fileUrl = `/uploads/messages/${mimeType.startsWith('image/') ? 'images' : 'pdfs'}/${fileName}`;
          processedFileName = fileName;
          processedFileSize = buffer.length;
        }
      }

      // Función para formatear el tamaño del archivo
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      // Función para obtener el icono según el tipo de archivo
      const getFileIcon = (type: string): string => {
        if (type === 'image') return '🖼️';
        if (type === 'pdf') return '📄';
        return '📎';
      };

      // Función para generar preview del contenido
      const generatePreview = (
        type: string,
        content: string,
        fileName?: string,
      ): string => {
        switch (type) {
          case 'text':
            return content.length > 100
              ? content.substring(0, 100) + '...'
              : content;
          case 'image':
            return `Imagen: ${fileName || 'Sin nombre'}`;
          case 'pdf':
            return `PDF: ${fileName || 'Documento PDF'}`;
          default:
            return `Archivo: ${fileName || 'Sin nombre'}`;
        }
      };

      const messageData = {
        id: Date.now(), // ID temporal
        conversationId: data.conversationId,
        senderId: client.userId,
        receiverId: data.receiverId,
        type: data.type,
        content: data.type === 'text' ? data.content : fileUrl || data.content,
        fileName: processedFileName,
        fileSize: processedFileSize,
        fileSizeFormatted: processedFileSize
          ? formatFileSize(processedFileSize)
          : undefined,
        fileIcon: getFileIcon(data.type),
        preview: generatePreview(
          data.type,
          data.content || '',
          processedFileName,
        ),
        timestamp: new Date(),
        isRead: false,
        // Metadatos adicionales para mejor visualización
        metadata: {
          isFile: data.type !== 'text',
          canDownload: data.type !== 'text' && (fileUrl || data.content),
          fileExtension: processedFileName
            ? processedFileName.split('.').pop()?.toUpperCase()
            : undefined,
        },
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
        const notificationMessage =
          data.type === 'text'
            ? data.content
            : `${getFileIcon(data.type)} ${processedFileName || 'Archivo'}`;

        this.server.to(receiverSocketId).emit('messageNotification', {
          conversationId: data.conversationId,
          senderId: client.userId,
          message: notificationMessage,
          type: data.type,
          fileIcon: getFileIcon(data.type),
          preview: generatePreview(
            data.type,
            data.content || '',
            processedFileName,
          ),
        });
      }

      this.logger.log(
        `1-to-1 message sent from user ${client.userId} to user ${data.receiverId} (${data.type})`,
      );
    } catch (error) {
      this.logger.error('Error processing message:', error);
      client.emit('messageError', {
        error: 'Error al procesar el mensaje',
        type: data.type,
      });
    }
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
