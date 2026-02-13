import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USERS_SERVICE } from 'src/config';
import { OwnerInfo } from 'src/publications/services/helpers/owner-helper.service';

export interface UserInfo {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  constructor(@Inject(USERS_SERVICE) private readonly client: ClientProxy) {}

  async getUsersByIds(userIds: number[]): Promise<OwnerInfo[]> {
    try {
      const users = await firstValueFrom(
        this.client.send('findUsersByIds', { ids: userIds }),
      );

      return users.map((user: any) => ({
        id: user.id,
        name: user.profile?.name || `Usuario ${user.id}`,
        lastName: user.profile?.lastName || '',
        email: user.email || '',
        profilePicture: user.profile?.profilePicture || null,
        coverPicture: user.profile?.coverPicture || null,
        profession: user.profile?.profession || 'Sin profesión',
      }));
    } catch (error) {
      console.error('Error getting users by IDs:', error);
      // Devolver información básica si falla
      return userIds.map((id) => ({
        id,
        name: `Usuario ${id}`,
        lastName: '',
        email: '',
        profilePicture: null,
        profession: 'Sin profesión',
      }));
    }
  }

  async getUserWithProfile(userId: number): Promise<any> {
    try {
      const user = await firstValueFrom(
        this.client.send('getUserWithProfile', { userId: userId }),
      );
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}
