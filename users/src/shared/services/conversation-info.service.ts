import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { COMMUNITIES_SERVICE } from 'src/config';

export interface ConversationInfo {
  id: number;
}

@Injectable()
export class ConversationInfoService {
  constructor(
    @Inject(COMMUNITIES_SERVICE)
    private readonly communitiesClient: ClientProxy,
  ) {}

  /**
   * Obtiene la información de conversación entre dos usuarios
   * @param userId1 ID del primer usuario
   * @param userId2 ID del segundo usuario
   * @returns Los datos de conversación o null si no existe conversación
   */
  async getConversationInfo(
    userId1: number,
    userId2: number,
  ): Promise<ConversationInfo | null> {
    try {
      const result = (await this.communitiesClient
        .send('getConversationInfo', { userId1, userId2 })
        .toPromise()) as ConversationInfo | null;
      return result;
    } catch {
      return null;
    }
  }
}
