/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USERS_SERVICE } from 'src/config';

export interface UserInfo {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  constructor(@Inject(USERS_SERVICE) private readonly client: ClientProxy) {}

  async getUsersByIds(userIds: number[]): Promise<any[]> {
    try {
      const users = await firstValueFrom(
        this.client.send('findUsersByIds', { ids: userIds }),
      );
      return users || [];
    } catch (error) {
      console.error('Error getting users by IDs:', error);
      return [];
    }
  }

  async getUserWithProfile(userId: number): Promise<any> {
    try {
      const user = await firstValueFrom(
        this.client.send('getUserWithProfile', { id: userId }),
      );
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}
