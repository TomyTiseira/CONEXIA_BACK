/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../common/services/users.service';
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
    private readonly usersService: UsersService,
  ) {}

  async execute(
    currentUserId: number,
    getConversationsDto: GetConversationsDto,
  ): Promise<{
    conversations: any[];
    pagination: PaginationInfo;
  }> {
    const { page = 1, limit = 10, search } = getConversationsDto;

    const { conversations, total } = search
      ? await this.conversationRepository.findByUserIdWithSearch(
          currentUserId,
          page,
          limit,
          search,
        )
      : await this.conversationRepository.findByUserIdCumulative(
          currentUserId,
          page,
          limit,
        );

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    // Obtener IDs de todos los usuarios con los que se tiene conversación
    const otherUserIds = conversations.map((conversation) => {
      return conversation.user1Id === currentUserId
        ? conversation.user2Id
        : conversation.user1Id;
    });

    // Obtener información de los usuarios
    const usersInfo = await this.usersService.getUsersByIds(otherUserIds);

    // Formatear conversaciones con información adicional
    const formattedConversations = conversations.map((conversation) => {
      const lastMessage = conversation.messages?.[0];
      const otherUserId =
        conversation.user1Id === currentUserId
          ? conversation.user2Id
          : conversation.user1Id;

      // Buscar información del otro usuario
      const otherUserInfo = usersInfo.find((user) => user.id === otherUserId);

      return {
        id: conversation.id,
        otherUser: {
          id: otherUserId,
          userName: otherUserInfo?.name || '',
          userProfilePicture: otherUserInfo?.profilePicture || null,
        },
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
