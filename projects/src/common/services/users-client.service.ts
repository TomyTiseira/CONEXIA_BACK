/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USERS_SERVICE } from 'src/config';

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

  async validateSkillsExist(
    skillIds: number[],
  ): Promise<{ valid: boolean; invalidIds: number[] }> {
    try {
      const skills = await firstValueFrom(
        this.client.send('findSkillsByIds', { ids: skillIds }),
      );

      const foundSkillIds = skills.map((skill: any) => skill.id);
      const invalidIds = skillIds.filter((id) => !foundSkillIds.includes(id));

      return {
        valid: invalidIds.length === 0,
        invalidIds,
      };
    } catch (error) {
      console.error('Error validating skills existence:', error);
      return {
        valid: false,
        invalidIds: skillIds,
      };
    }
  }

  async validateLocalityExists(localityId: number): Promise<boolean> {
    try {
      const locality = await firstValueFrom(
        this.client.send('validateLocalityExists', { id: localityId }),
      );
      return !!locality;
    } catch {
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

  async getSkillsByIds(skillIds: number[]): Promise<any[]> {
    try {
      const skills = await firstValueFrom(
        this.client.send('findSkillsByIds', { ids: skillIds }),
      );
      return skills || [];
    } catch (error) {
      console.error('Error getting skills by IDs:', error);
      return [];
    }
  }

  async getLocalityById(localityId: number): Promise<any> {
    try {
      const locality = await firstValueFrom(
        this.client.send('getLocalityById', { id: localityId }),
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
        this.client.send('getUserWithProfile', { userId }),
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

  /**
   * Valida que el usuario esté verificado
   * Lanza una excepción si el usuario no está verificado
   */
  async validateUserIsVerified(userId: number): Promise<void> {
    await firstValueFrom(
      this.client.send('validateUserIsVerified', { userId }),
    );
  }

  /**
   * Verifica si un usuario está verificado sin lanzar excepciones
   */
  async isUserVerified(userId: number): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.client.send('isUserVerified', { userId }),
      );
      return !!result;
    } catch (error) {
      console.error('Error checking user verification status:', error);
      return false;
    }
  }
}
