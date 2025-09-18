/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, take, timeout } from 'rxjs';
import { USERS_SERVICE } from 'src/config';
import { SkillService } from '../../shared/services/skill.service';

@Injectable()
export class UsersClientService {
  constructor(
    @Inject(USERS_SERVICE) private readonly client: ClientProxy,
    private readonly skillService: SkillService,
  ) {}

  async validateUserExists(userId: number): Promise<boolean> {
    try {
      const user = await firstValueFrom(
        this.client
          .send('findUserById', { id: userId })
          .pipe(take(1), timeout(3000)),
      );
      return !!user;
    } catch (error) {
      console.error('Error validating user existence:', error);
      return false;
    }
  }

  async validateSkillsExist(
    skillIds: number[],
  ): Promise<{ valid: boolean; invalidIds: number[] }> {
    // Ahora usamos el servicio local de habilidades
    return this.skillService.validateSkillsExist(skillIds);
  }

  async validateLocalityExists(localityId: number): Promise<boolean> {
    try {
      const locality = await firstValueFrom(
        this.client
          .send('validateLocalityExists', { id: localityId })
          .pipe(take(1), timeout(3000)),
      );
      return !!locality;
    } catch {
      return false;
    }
  }

  async getUsersByIds(userIds: number[]): Promise<any[]> {
    try {
      const users = await firstValueFrom(
        this.client
          .send('findUsersByIds', { ids: userIds })
          .pipe(take(1), timeout(3000)),
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
        this.client
          .send('findUserById', { id: userId })
          .pipe(take(1), timeout(3000)),
      );
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async getSkillsByIds(skillIds: number[]): Promise<any[]> {
    // Ahora usamos el servicio local de habilidades
    return this.skillService.findByIds(skillIds);
  }

  async getLocalityById(localityId: number): Promise<any> {
    try {
      const locality = await firstValueFrom(
        this.client
          .send('getLocalityById', { id: localityId })
          .pipe(take(1), timeout(3000)),
      );
      return locality;
    } catch (error) {
      console.error('Error getting locality by ID:', error);
      return null;
    }
  }

  async getUserWithProfile(userId: number): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.client
          .send('getUserWithProfile', { userId })
          .pipe(take(1), timeout(3000)),
      );
      return result;
    } catch (error) {
      console.error('Error getting user with profile:', error);
      return null;
    }
  }

  async getUserRole(userId: number): Promise<any> {
    try {
      const user = await firstValueFrom(
        this.client
          .send('findUserById', { id: userId })
          .pipe(take(1), timeout(3000)),
      );

      if (!user || !user.roleId) {
        return null;
      }

      const role = await firstValueFrom(
        this.client
          .send('getRoleById', user.roleId.toString())
          .pipe(take(1), timeout(3000)),
      );

      return role;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }
}
