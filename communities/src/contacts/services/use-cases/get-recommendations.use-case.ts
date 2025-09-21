import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/common/services/users.service';
import { DataSource } from 'typeorm';
import { ConnectionRepository } from '../../repositories/connection.repository';

@Injectable()
export class GetRecommendationsUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly connectionRepository: ConnectionRepository,
  ) {}

  /**
   * Obtiene recomendaciones de usuarios por skills y amigos en común
   * @param userId ID del usuario actual
   * @param limit Cantidad máxima de recomendaciones
   */
  async execute(userId: number, limit = 12): Promise<any[]> {
    // 1. Obtener IDs de usuarios ya conectados (amigos actuales)
    const connectedIds = await this.getConnectedUserIds(userId);

    // 2. Obtener IDs de usuarios a los que ya se les envió solicitud pendiente
    const pendingRequestsSent =
      await this.connectionRepository.findPendingBySender(userId, 1000, 1);
    const pendingSentIds = pendingRequestsSent.map(
      (req: any) => req.receiverId,
    );

    // 2.1. Obtener IDs de usuarios que enviaron solicitud pendiente al usuario actual
    const pendingRequestsReceived =
      await this.connectionRepository.findPendingByReceiver(userId, 1000, 1);
    const pendingReceivedIds = pendingRequestsReceived.map(
      (req: any) => req.senderId,
    );

    // Combinar ambas listas de IDs pendientes
    const pendingIds = [...pendingSentIds, ...pendingReceivedIds];

    // 3. Obtener todos los candidatos (no conectados, no admins/moderadores, no el mismo usuario, no pendientes)
    const excludeIds = [...connectedIds, ...pendingIds];
    const candidateIds = await this.getCandidateUserIds(userId, excludeIds);
    if (candidateIds.length === 0) return [];

    // 3. Obtener skills del usuario actual
    const [currentUser] = await this.usersService.getUsersByIds([userId]);
    const currentSkills =
      (currentUser as any)?.profileSkills?.map((ps: any) => ps.skillId) || [];

    // 4. Obtener perfiles y skills de los candidatos
    const candidates = await this.usersService.getUsersByIds(candidateIds);

    // 5. Calcular matches de skills y amigos en común (ahora async)
    const recommendations = await Promise.all(
      candidates.map(async (candidate: any) => {
        const candidateSkills =
          candidate.profileSkills?.map((ps: any) => ps.skillId) || [];
        const skillsInCommon = currentSkills.filter((s: number) =>
          candidateSkills.includes(s),
        ).length;
        const friendsInCommon = await this.countMutualFriends(
          userId,
          candidate.id,
        );
        // Obtener la foto de portada si existe
        let coverPicture = null;
        if (candidate.profile && candidate.profile.coverPicture) {
          coverPicture = candidate.profile.coverPicture;
        } else if (candidate.coverPicture) {
          coverPicture = candidate.coverPicture;
        }
        return {
          ...candidate,
          skillsInCommon,
          friendsInCommon,
          coverPicture,
        };
      }),
    );

    // 6. Ordenar y limitar
    recommendations.sort((a, b) => {
      if (b.skillsInCommon !== a.skillsInCommon) {
        return b.skillsInCommon - a.skillsInCommon;
      }
      return b.friendsInCommon - a.friendsInCommon;
    });
    return recommendations.slice(0, limit);
  }

  private async getConnectedUserIds(userId: number): Promise<number[]> {
    // Buscar conexiones aceptadas donde el usuario es sender o receiver
    const [connections] =
      await this.connectionRepository.findAcceptedConnectionsByUserId(
        userId,
        1000,
        1,
      );
    const ids = new Set<number>();
    connections.forEach((conn: any) => {
      if (conn.senderId === userId) ids.add(conn.receiverId);
      else if (conn.receiverId === userId) ids.add(conn.senderId);
    });
    return Array.from(ids);
  }

  private async getCandidateUserIds(
    userId: number,
    excludeIds: number[],
  ): Promise<number[]> {
    // Obtener conexiones directas
    const [connections] =
      await this.connectionRepository.findAcceptedConnectionsByUserId(
        userId,
        1000,
        1,
      );
    const directIds = new Set<number>();
    connections.forEach((conn: any) => {
      if (conn.senderId === userId) directIds.add(conn.receiverId);
      else if (conn.receiverId === userId) directIds.add(conn.senderId);
    });

    // Buscar amigos de amigos
    const friendsOfFriends = new Set<number>();
    for (const friendId of directIds) {
      const [friendConnections] =
        await this.connectionRepository.findAcceptedConnectionsByUserId(
          friendId,
          1000,
          1,
        );
      friendConnections.forEach((conn: any) => {
        if (
          conn.senderId !== friendId &&
          conn.senderId !== userId &&
          !directIds.has(conn.senderId)
        ) {
          friendsOfFriends.add(conn.senderId);
        }
        if (
          conn.receiverId !== friendId &&
          conn.receiverId !== userId &&
          !directIds.has(conn.receiverId)
        ) {
          friendsOfFriends.add(conn.receiverId);
        }
      });
    }

    // Unir directos y amigos de amigos, excluir el usuario actual y los ya conectados
    const candidateIds = Array.from(
      new Set([...Array.from(directIds), ...Array.from(friendsOfFriends)]),
    ).filter((id) => id !== userId && !excludeIds.includes(id));
    return candidateIds;
  }

  // Obtiene los amigos (conexiones aceptadas) de un usuario
  private async getFriendsIds(userId: number): Promise<number[]> {
    const [connections] =
      await this.connectionRepository.findAcceptedConnectionsByUserId(
        userId,
        1000,
        1,
      );
    const ids = new Set<number>();
    connections.forEach((conn: any) => {
      if (conn.senderId === userId) ids.add(conn.receiverId);
      else if (conn.receiverId === userId) ids.add(conn.senderId);
    });
    return Array.from(ids);
  }

  // Calcula la cantidad de amigos en común entre el usuario actual y el candidato
  private async countMutualFriends(
    userId: number,
    candidateId: number,
  ): Promise<number> {
    const userFriends = await this.getFriendsIds(userId);
    const candidateFriends = await this.getFriendsIds(candidateId);
    const mutual = userFriends.filter((id) => candidateFriends.includes(id));
    return mutual.length;
  }
}
