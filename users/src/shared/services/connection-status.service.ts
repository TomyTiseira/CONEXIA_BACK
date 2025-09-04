import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Injectable()
export class ConnectionStatusService {
  constructor(
    @Inject('COMMUNITIES_SERVICE')
    private readonly communitiesClient: ClientProxy,
  ) {}

  /**
   * Obtiene el estado de conexión entre dos usuarios
   * @param userId1 ID del primer usuario
   * @param userId2 ID del segundo usuario
   * @returns El estado de conexión o null si no existe conexión
   */
  async getConnectionStatus(
    userId1: number,
    userId2: number,
  ): Promise<ConnectionStatus | null> {
    try {
      const result = (await this.communitiesClient
        .send('getConnectionStatus', { userId1, userId2 })
        .toPromise()) as ConnectionStatus | null;
      return result;
    } catch {
      return null;
    }
  }
}
