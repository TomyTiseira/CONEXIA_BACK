/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import {
  calculatePagination,
  PaginationInfo,
} from '../../../common/utils/pagination.utils';
import { GetConversationsDto } from '../../dto/get-conversations.dto';
import { ConversationRepository } from '../../repositories/conversation.repository';

@Injectable()
export class GetConversationsUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async execute(
    currentUserId: number,
    getConversationsDto: GetConversationsDto,
  ): Promise<{
    conversations: any[];
    pagination: PaginationInfo;
  }> {
    const { page = 1, limit = 10 } = getConversationsDto;

    const { conversations, total } =
      await this.conversationRepository.findByUserIdCumulative(
        currentUserId,
        page,
        limit,
      );

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    // Formatear conversaciones con información adicional
    const formattedConversations = conversations.map((conversation) => {
      const lastMessage =
        conversation.messages?.[conversation.messages.length - 1];
      const otherUserId =
        conversation.user1Id === currentUserId
          ? conversation.user2Id
          : conversation.user1Id;

      return {
        id: conversation.id,
        otherUserId,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              type: lastMessage.type,
              content: lastMessage.content,
              fileName: lastMessage.fileName,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount:
          conversation.messages?.filter(
            (m) => m.receiverId === currentUserId && !m.isRead,
          ).length || 0,
        updatedAt: conversation.updatedAt,
      };
    });

    return {
      conversations: formattedConversations,
      pagination,
    };
  }
}
