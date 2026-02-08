import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USERS_SERVICE } from 'src/config';

export interface UserSearchResult {
  id: number;
  name: string;
  lastName: string;
  email: string;
}

@Injectable()
export class UserSearchService {
  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersClient: ClientProxy,
  ) {}

  /**
   * Busca usuarios por nombre o email
   * @param searchTerm Término de búsqueda
   * @param excludeUserId ID del usuario a excluir de la búsqueda
   * @returns Array de usuarios que coinciden con la búsqueda
   */
  async searchUsers(
    searchTerm: string,
    excludeUserId?: number,
  ): Promise<UserSearchResult[]> {
    try {
      const result = (await this.usersClient
        .send('searchUsers', { searchTerm, excludeUserId })
        .toPromise()) as UserSearchResult[];
      return result || [];
    } catch {
      return [];
    }
  }
}
