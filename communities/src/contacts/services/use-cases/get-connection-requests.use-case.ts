import { Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '../../../common/exceptions/connections.exceptions';
import { UsersService } from '../../../common/services/users.service';
import { GetConnectionRequestsDto } from '../../dto/get-connection-requests.dto';
import { ConnectionRepository } from '../../repositories/connection.repository';
import { ConnectionRequestResponse } from '../../response/connection-request.response';

@Injectable()
export class GetConnectionRequestsUseCase {
  constructor(
    private readonly connectionRepository: ConnectionRepository,
    private readonly usersService: UsersService,
  ) {}

  async execute(
    getConnectionRequestsDto: GetConnectionRequestsDto,
  ): Promise<ConnectionRequestResponse[]> {
    const { userId, limit = 10, page = 1 } = getConnectionRequestsDto;

    try {
      const connections = await this.connectionRepository.findPendingByReceiver(
        userId,
        limit,
        page,
      );

      if (connections.length === 0) {
        return [];
      }

      // Obtener información de los usuarios remitentes con perfiles
      const senderIds = [
        ...new Set(connections.map((connection) => connection.senderId)),
      ];
      const userPromises = senderIds.map((id) =>
        this.usersService.getUserWithProfile(id),
      );
      const userResults = await Promise.allSettled(userPromises);

      const usersMap = new Map();
      userResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const userId = senderIds[index];
          const userData = result.value;
          const userName = userData.profile
            ? `${userData.profile.name} ${userData.profile.lastName}`.trim()
            : 'Usuario';
          usersMap.set(userId, {
            name: userName,
            email: userData.user?.email,
            image: userData.profile?.profilePicture,
            coverPicture: userData.profile?.coverPicture || null,
            profession: userData.profile?.profession || 'Sin profesión',
          });
        }
      });

      return connections.map((connection) => {
        const senderInfo = usersMap.get(connection.senderId);

        return {
          id: connection.id,
          senderId: connection.senderId,
          receiverId: connection.receiverId,
          status: connection.status,
          message: connection.message,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
          sender: {
            name: senderInfo?.name || 'Usuario',
            email: senderInfo?.email || '',
            image: senderInfo?.image || '',
            coverPicture: senderInfo?.coverPicture || null,
            profession: senderInfo?.profession || 'Sin profesión',
          },
        };
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
