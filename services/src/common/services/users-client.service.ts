/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USERS_SERVICE } from '../../config';

@Injectable()
export class UsersClientService {
  constructor(@Inject(USERS_SERVICE) private readonly client: ClientProxy) {}

  async validateUserExists(userId: number): Promise<boolean> {
    try {
      const user = await firstValueFrom(
        this.client.send('findUserById', { id: userId }),
      );
      return !!user;
    } catch (error) {
      console.error('Error validating user existence:', error);
      return false;
    }
  }

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

  async getUserById(userId: number): Promise<any> {
    try {
      const user = await firstValueFrom(
        this.client.send('findUserById', { id: userId }),
      );
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async getUserRole(userId: number): Promise<any> {
    try {
      const user = await firstValueFrom(
        this.client.send('findUserById', { id: userId }),
      );

      if (!user || !user.roleId) {
        return null;
      }

      const role = await firstValueFrom(
        this.client.send('getRoleById', user.roleId.toString()),
      );

      return role;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }
}