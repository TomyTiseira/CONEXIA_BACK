import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { join } from 'path';
import { catchError, of, timeout } from 'rxjs';
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
        // Generar URL absoluta para archivos
        const baseUrl =
          process.env.API_BASE_URL ||
          `http://localhost:${process.env.PORT || 8080}`;
        const fileUrl =
          data.type !== 'text' && data.content
            ? `${baseUrl}/api/messaging/messages/${result.messageId}/file`
            : null;

        // Determinar el tipo MIME correcto
        const mimeType =
          data.type === 'image'
            ? 'image/*'
            : data.type === 'pdf'
              ? 'application/pdf'
              : 'text/plain';

        const messageData = {
          id: result.messageId,
          conversationId: result.conversationId,
          senderId: data.currentUserId,
          receiverId: data.receiverId,
          type: data.type,
          content: fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: mimeType,
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

  async getConversations(
    currentUserId: number,
    page = 1,
    limit = 10,
    search?: string,
  ) {
    try {
      return await this.client
        .send('getConversations', {
          currentUserId,
          page,
          limit,
          search,
        })
        .pipe(
          timeout(5000),
          catchError(() => of({ conversations: [], total: 0, page, limit })),
        )
        .toPromise();
    } catch (error) {
      console.warn('Communities microservice not available:', error.message);
      return { conversations: [], total: 0, page, limit };
    }
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
    try {
      return await this.client
        .send('getUnreadCount', {
          currentUserId,
        })
        .pipe(
          timeout(5000),
          catchError(() => of({ unreadCount: 0 })),
        )
        .toPromise();
    } catch (error) {
      console.warn('Communities microservice not available:', error.message);
      return { unreadCount: 0 };
    }
  }

  async getMessageFile(messageId: number, currentUserId: number, res: any) {
    try {
      // Obtener información del mensaje
      const messageInfo = await this.client
        .send('getMessageById', { messageId, currentUserId })
        .toPromise();

      if (!messageInfo || !messageInfo.fileUrl) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Si es una URL de GCS (comienza con https://storage.googleapis.com/),
      // redirigir directamente a la URL pública
      if (messageInfo.fileUrl.startsWith('https://storage.googleapis.com/')) {
        return res.redirect(messageInfo.fileUrl);
      }

      // Para archivos locales, servirlos desde el filesystem
      const filePath = join(process.cwd(), messageInfo.fileUrl);

      // Verificar que el archivo existe
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found on disk' });
      }

      // Determinar el tipo de contenido
      const mimeType =
        messageInfo.type === 'image' ? 'image/*' : 'application/pdf';

      // Configurar headers para descarga
      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${messageInfo.fileName}"`,
      );
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año

      // Enviar el archivo
      return res.sendFile(filePath);
    } catch {
      return res.status(500).json({ message: 'Error retrieving file' });
    }
  }
}
