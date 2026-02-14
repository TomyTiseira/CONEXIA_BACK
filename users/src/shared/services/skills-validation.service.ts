import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Skill, SkillsValidationResult } from '../interfaces/skill.interface';

@Injectable()
export class SkillsValidationService {
  constructor(
    @Inject('PROJECTS_SERVICE') private readonly client: ClientProxy,
  ) {}

  /**
   * Valida que las skills existan consultando al microservicio de proyectos
   */
  async validateSkillsExist(
    skillIds: number[],
  ): Promise<SkillsValidationResult> {
    try {
      const result = await firstValueFrom(
        this.client.send('validateSkillsExist', { skillIds }),
      );
      return result;
    } catch (error) {
      console.error(
        'Error validating skills existence from projects service:',
        error,
      );
      return {
        valid: false,
        invalidIds: skillIds,
      };
    }
  }

  /**
   * Obtiene skills por IDs consultando al microservicio de proyectos
   */
  async getSkillsByIds(skillIds: number[]): Promise<Skill[]> {
    try {
      const skills = await firstValueFrom(
        this.client.send('findSkillsByIds', { ids: skillIds }),
      );
      return skills || [];
    } catch (error) {
      console.error(
        'Error getting skills by IDs from projects service:',
        error,
      );
      return [];
    }
  }

  /**
   * Obtiene una skill por ID consultando al microservicio de proyectos
   */
  async getSkillById(id: number): Promise<Skill | null> {
    try {
      const skill = await firstValueFrom(
        this.client.send('getSkillById', { id }),
      );
      return skill;
    } catch (error) {
      console.error('Error getting skill by ID from projects service:', error);
      return null;
    }
  }

  /**
   * Obtiene todas las skills consultando al microservicio de proyectos
   */
  async getAllSkills(): Promise<Skill[]> {
    try {
      const skills = await firstValueFrom(this.client.send('getSkills', {}));
      return skills || [];
    } catch (error) {
      console.error('Error getting all skills from projects service:', error);
      return [];
    }
  }
}
