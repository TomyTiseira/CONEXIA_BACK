/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '../../../common/exceptions/connections.exceptions';
import { UsersService } from '../../../common/services/users.service';
import { GetSentConnectionRequestsDto } from '../../dto/get-sent-connection-requests.dto';
import { ConnectionRepository } from '../../repositories/connection.repository';
import { SentConnectionRequestResponse } from '../../response/sent-connection-request.response';

@Injectable()
export class GetSentConnectionRequestsUseCase {
  constructor(
    private readonly connectionRepository: ConnectionRepository,
    private readonly usersService: UsersService,
  ) {}

  async execute(
    getSentConnectionRequestsDto: GetSentConnectionRequestsDto,
  ): Promise<SentConnectionRequestResponse[]> {
    const { userId, limit = 10, page = 1 } = getSentConnectionRequestsDto;

    try {
      const connections = await this.connectionRepository.findPendingBySender(
        userId,
        limit,
        page,
      );

      if (connections.length === 0) {
        return [];
      }

      // Obtener información de los usuarios receptores con perfiles
      const receiverIds = [
        ...new Set(connections.map((connection) => connection.receiverId)),
      ];
      const userPromises = receiverIds.map((id) =>
        this.usersService.getUserWithProfile(id),
      );
      const userResults = await Promise.allSettled(userPromises);

      const usersMap = new Map();
      userResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const userId = receiverIds[index];
          const userData = result.value;
          const userName = userData.profile
            ? `${userData.profile.name} ${userData.profile.lastName}`.trim()
            : 'Usuario';
          usersMap.set(userId, {
            name: userName,
            email: userData.user?.email,
            image: userData.profile?.profilePicture,
            profession: userData.profile?.profession || 'Sin profesión',
          });
        }
      });

      return connections.map((connection) => {
        const receiverInfo = usersMap.get(connection.receiverId);

        return {
          id: connection.id,
          senderId: connection.senderId,
          receiverId: connection.receiverId,
          status: connection.status,
          message: connection.message,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
          receiver: {
            name: receiverInfo?.name || 'Usuario',
            email: receiverInfo?.email || '',
            image: receiverInfo?.image || '',
            profession: receiverInfo?.profession || 'Sin profesión',
          },
        };
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
