import { Injectable } from '@nestjs/common';
import { SendMessageDto } from '../../dto/send-message.dto';
import { MessageType } from '../../entities/message.entity';
import {
  EmptyMessageContentException,
  FileRequiredException,
} from '../../exceptions/messaging.exceptions';
import { ConversationRepository } from '../../repositories/conversation.repository';
import { MessageRepository } from '../../repositories/message.repository';

@Injectable()
export class SendMessageUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(
    currentUserId: number,
    sendMessageDto: SendMessageDto,
  ): Promise<{ message: string; messageId: number; conversationId: number }> {
    const { receiverId, type, content, fileName, fileSize } = sendMessageDto;

    // Buscar o crear conversación entre los dos usuarios
    let conversation = await this.conversationRepository.findByUsers(
      currentUserId,
      receiverId,
    );

    if (!conversation) {
      // Asegurar que user1Id < user2Id para mantener consistencia
      const [user1Id, user2Id] = [currentUserId, receiverId].sort(
        (a, b) => a - b,
      );

      conversation = await this.conversationRepository.create({
        user1Id,
        user2Id,
      });
    }

    // Validar contenido según el tipo de mensaje
    this.validateMessageContent(type, content, fileName);

    // Crear mensaje
    const message = await this.messageRepository.create({
      conversationId: conversation.id,
      senderId: currentUserId,
      receiverId,
      type,
      content: type === MessageType.TEXT ? content : undefined,
      fileUrl: type !== MessageType.TEXT ? content : undefined,
      fileName: type !== MessageType.TEXT ? fileName : undefined,
      fileSize: type !== MessageType.TEXT ? fileSize : undefined,
    });

    // Actualizar timestamp de la conversación
    await this.conversationRepository.updateLastMessage(conversation.id);

    return {
      message: 'message sent successfully',
      messageId: message.id,
      conversationId: conversation.id,
    };
  }

  private validateMessageContent(
    type: MessageType,
    content?: string,
    fileName?: string,
  ): void {
    switch (type) {
      case MessageType.TEXT:
        if (!content || content.trim().length === 0) {
          throw new EmptyMessageContentException();
        }
        break;
      case MessageType.IMAGE:
        if (!content || !fileName) {
          throw new FileRequiredException('image');
        }
        break;
      case MessageType.PDF:
        if (!content || !fileName) {
          throw new FileRequiredException('PDF');
        }
        break;
    }
  }
}
