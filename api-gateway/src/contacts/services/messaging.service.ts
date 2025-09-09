/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from '../../config/service';
import { MessagingGateway } from '../websockets/messaging.gateway';

@Injectable()
export class MessagingService {
  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  async sendMessage(data: {
    currentUserId: number;
    receiverId: number;
    type: 'text' | 'image' | 'pdf';
    content?: string;
    fileName?: string;
    fileSize?: number;
  }) {
    try {
      // Enviar mensaje a través de NATS al microservicio
      const result = await this.client.send('sendMessage', data).toPromise();

      // Si el mensaje se guardó correctamente, enviarlo por WebSocket
      if (result && result.messageId) {
        const messageData = {
          id: result.messageId,
          conversationId: result.conversationId,
          senderId: data.currentUserId,
          receiverId: data.receiverId,
          type: data.type,
          content: data.content,
          fileName: data.fileName,
          fileSize: data.fileSize,
          timestamp: new Date(),
          isRead: false,
        };

        // Enviar por WebSocket usando la nueva lógica 1 a 1
        this.messagingGateway.sendMessageToConversation(
          data.currentUserId,
          data.receiverId,
          messageData,
        );

        // Enviar notificación si el receptor no está en línea
        if (!this.messagingGateway.isUserOnline(data.receiverId)) {
          this.messagingGateway.sendNotificationToUser(data.receiverId, {
            type: 'new_message',
            conversationId: result.conversationId,
            senderId: data.currentUserId,
            message:
              data.type === 'text' ? data.content : `Archivo: ${data.fileName}`,
          });
        }
      }

      return result;
    } catch (error) {
      // Si el error ya tiene el formato correcto del microservicio, lo pasamos directamente
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        'message' in error &&
        error.status !== 'error' // No es el objeto genérico de NestJS
      ) {
        throw new RpcException(error);
      }
    }
  }

  async getConversations(currentUserId: number, page = 1, limit = 10) {
    return this.client
      .send('getConversations', {
        currentUserId,
        page,
        limit,
      })
      .toPromise();
  }

  async getMessages(
    conversationId: number,
    currentUserId: number,
    page = 1,
    limit = 20,
  ) {
    return this.client
      .send('getMessages', {
        conversationId,
        currentUserId,
        page,
        limit,
      })
      .toPromise();
  }

  async markMessagesAsRead(
    conversationId: number,
    messageIds: number[],
    currentUserId: number,
    otherUserId: number,
  ) {
    const result = await this.client
      .send('markMessagesAsRead', {
        conversationId,
        messageIds,
        currentUserId,
      })
      .toPromise();

    // Notificar por WebSocket que los mensajes fueron leídos en chat 1 a 1
    if (otherUserId > 0) {
      this.messagingGateway.sendMessageToConversation(
        currentUserId,
        otherUserId,
        {
          type: 'messagesRead',
          userId: currentUserId,
          conversationId,
          messageIds,
        },
      );
    }

    return result;
  }

  async getUnreadCount(currentUserId: number) {
    return this.client
      .send('getUnreadCount', {
        currentUserId,
      })
      .toPromise();
  }
}
