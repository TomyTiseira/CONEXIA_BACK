/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

  async getSkillsByIds(skillIds: number[]): Promise<any[]> {
    try {
      const skills = await firstValueFrom(
        this.client.send('findSkillsByIds', { ids: skillIds }),
      );
      return skills;
    } catch {
      return [];
    }
  }

  async getAllUsersExcept(
    currentUserId: number,
    excludedIds: number[],
    limit: number,
  ): Promise<number[]> {
    try {
      const users = await firstValueFrom(
        this.client.send('getAllUsersExcept', {
          currentUserId,
          excludedIds,
          limit,
        }),
      );
      return users;
    } catch {
      return [];
    }
  }
}
