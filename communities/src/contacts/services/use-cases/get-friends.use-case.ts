/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../../../common/services/users.service';
import {
  calculatePagination,
  PaginationInfo,
} from '../../../common/utils/pagination.utils';
import { GetFriendsDto } from '../../dto/get-friends.dto';
import { ConnectionRepository } from '../../repositories/connection.repository';
import { ConversationRepository } from '../../repositories/conversation.repository';
import { FriendResponse } from '../../response/friend.response';

@Injectable()
export class GetFriendsUseCase {
  constructor(
    private readonly connectionRepository: ConnectionRepository,
    private readonly usersService: UsersService,
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async execute(getFriendsDto: GetFriendsDto): Promise<{
    friends: FriendResponse[];
    pagination: PaginationInfo;
  }> {
    const { userId, limit = 12, page = 1 } = getFriendsDto;

    try {
      const [connections, total] =
        await this.connectionRepository.findAcceptedConnectionsByUserId(
          userId,
          limit,
          page,
        );

      if (connections.length === 0) {
        // Calcular información de paginación
        const pagination = calculatePagination(total, { page, limit });

        return {
          friends: [],
          pagination,
        };
      }

      // Obtener IDs de los amigos (tanto sender como receiver, excluyendo el usuario actual)
      const friendIds = connections.map((connection) =>
        connection.senderId === userId
          ? connection.receiverId
          : connection.senderId,
      );

      // Obtener información de los amigos con perfiles
      const userPromises = friendIds.map((id) =>
        this.usersService.getUserWithProfile(id),
      );
      const userResults = await Promise.allSettled(userPromises);

      const usersMap = new Map();
      userResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const friendId = friendIds[index];
          const userData = result.value;
          const userName = userData.profile
            ? `${userData.profile.name} ${userData.profile.lastName}`.trim()
            : 'Usuario';
          usersMap.set(friendId, {
            name: userName,
            email: userData.user?.email,
            profession: userData.profile?.profession || '',
            profilePicture: userData.profile?.profilePicture,
          });
        }
      });

      // Obtener conversaciones para cada amigo
      const conversationPromises = friendIds.map((friendId) =>
        this.conversationRepository.findByUsers(userId, friendId),
      );
      const conversations = await Promise.allSettled(conversationPromises);

      const friends = connections.map((connection, index) => {
        const friendId =
          connection.senderId === userId
            ? connection.receiverId
            : connection.senderId;
        const friendInfo = usersMap.get(friendId);

        // Obtener la conversación correspondiente
        const conversationResult = conversations[index];
        const conversation =
          conversationResult.status === 'fulfilled'
            ? conversationResult.value
            : null;

        return {
          id: friendId,
          userId: friendId,
          userName: friendInfo?.name || 'Usuario',
          userEmail: friendInfo?.email || '',
          profession: friendInfo?.profession || 'Sin profesión',
          profilePicture: friendInfo?.profilePicture,
          connectionId: connection.id,
          status: connection.status,
          conversationId: conversation?.id || null,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        };
      });

      // Calcular información de paginación
      const pagination = calculatePagination(total, { page, limit });

      return {
        friends,
        pagination,
      };
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
