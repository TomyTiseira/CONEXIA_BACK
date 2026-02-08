import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../common/services/users.service';
import {
  calculateCumulativePagination,
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

    const result = search
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

    const { conversations, total } = result;

    // Calcular información de paginación acumulativa
    const pagination = calculateCumulativePagination(total, { page, limit });

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
          userLastName: otherUserInfo?.lastName || '',
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
        unreadCount: (conversation as any).unreadMessages?.length || 0,
        updatedAt: conversation.updatedAt,
      };
    });

    return {
      conversations: formattedConversations,
      pagination,
    };
  }
}
