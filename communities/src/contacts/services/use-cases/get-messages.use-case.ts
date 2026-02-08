import { Injectable } from '@nestjs/common';
import {
  calculateCumulativePagination,
  PaginationInfo,
} from '../../../common/utils/pagination.utils';
import { GetMessagesDto } from '../../dto/get-messages.dto';
import { Message } from '../../entities/message.entity';
import {
  ConversationAccessDeniedException,
  ConversationNotFoundException,
} from '../../exceptions/messaging.exceptions';
import { ConversationRepository } from '../../repositories/conversation.repository';
import { MessageRepository } from '../../repositories/message.repository';

@Injectable()
export class GetMessagesUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async execute(
    currentUserId: number,
    getMessagesDto: GetMessagesDto,
  ): Promise<{
    messages: Message[];
    pagination: PaginationInfo;
  }> {
    const { conversationId, page = 1, limit = 50 } = getMessagesDto;

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

    // Usar paginación acumulativa para mensajes
    const { messages, total } =
      await this.messageRepository.findByConversationIdCumulative(
        conversationId,
        page,
        limit,
      );

    // Calcular información de paginación acumulativa
    const pagination = calculateCumulativePagination(total, { page, limit });

    // Formatear mensajes
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      type: message.type,
      content: message.content,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      senderId: message.senderId,
      receiverId: message.receiverId,
      isRead: message.isRead,
      createdAt: message.createdAt,
    }));

    return {
      messages: formattedMessages as Message[],
      pagination,
    };
  }
}
