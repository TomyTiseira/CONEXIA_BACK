import { Injectable } from '@nestjs/common';
import { MarkMessagesReadDto } from '../../dto/mark-messages-read.dto';
import {
  ConversationAccessDeniedException,
  ConversationNotFoundException,
} from '../../exceptions/messaging.exceptions';
import { ConversationRepository } from '../../repositories/conversation.repository';
import { MessageRepository } from '../../repositories/message.repository';

@Injectable()
export class MarkMessagesReadUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async execute(
    currentUserId: number,
    conversationId: number,
    markMessagesReadDto: MarkMessagesReadDto,
  ): Promise<{ message: string }> {
    const { messageIds } = markMessagesReadDto;

    // Verificar que el usuario tiene acceso a esta conversación
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    const isParticipant =
      conversation.user1Id === currentUserId ||
      conversation.user2Id === currentUserId;

    if (!isParticipant) {
      throw new ConversationAccessDeniedException();
    }

    // Marcar mensajes como leídos
    await this.messageRepository.markAsRead(messageIds, currentUserId);

    return {
      message: 'messages marked as read',
    };
  }
}
