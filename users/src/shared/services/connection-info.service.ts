import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { COMMUNITIES_SERVICE } from 'src/config';

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface ConnectionInfo {
  id: number;
  state: ConnectionStatus;
  senderId: number;
}

@Injectable()
export class ConnectionInfoService {
  constructor(
    @Inject(COMMUNITIES_SERVICE)
    private readonly communitiesClient: ClientProxy,
  ) {}

  /**
   * Obtiene la información completa de conexión entre dos usuarios
   * @param userId1 ID del primer usuario
   * @param userId2 ID del segundo usuario
   * @returns Los datos completos de conexión o null si no existe conexión
   */
  async getConnectionInfo(
    userId1: number,
    userId2: number,
  ): Promise<ConnectionInfo | null> {
    try {
      const result = (await this.communitiesClient
        .send('getConnectionInfo', { userId1, userId2 })
        .toPromise()) as ConnectionInfo | null;
      return result;
    } catch {
      return null;
    }
  }
}
