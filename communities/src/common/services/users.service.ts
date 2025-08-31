/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export interface OwnerInfo {
  id: number;
  name: string;
  profilePicture?: string;
  profession: string;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  async getUsersByIds(userIds: number[]): Promise<OwnerInfo[]> {
    try {
      const users = await firstValueFrom(
        this.usersClient.send('findUsersByIds', { ids: userIds }),
      );

      return users.map((user: any) => ({
        id: user.id,
        name: user.profile
          ? `${user.profile.name} ${user.profile.lastName}`
          : 'Usuario',
        profilePicture: user.profile?.profilePicture,
        profession: user.profile?.profession || 'Sin profesión',
      }));
    } catch (error) {
      console.error('Error getting users by IDs:', error);
      return userIds.map((id) => ({
        id,
        name: 'Usuario',
        profilePicture: undefined,
        profession: 'Sin profesión',
      }));
    }
  }
}
