import { Injectable } from '@nestjs/common';
import { Skill } from '../entities/skill.entity';
import { SkillRepository } from '../repository/skill.repository';

@Injectable()
export class SkillService {
  constructor(private readonly skillRepository: SkillRepository) {}

  async findAll(): Promise<Skill[]> {
    return this.skillRepository.findAll();
  }

  async findById(id: number): Promise<Skill | null> {
    return this.skillRepository.findById(id);
  }

  async findByIds(ids: number[]): Promise<Skill[]> {
    return this.skillRepository.findByIds(ids);
  }

  async findByName(name: string): Promise<Skill | null> {
    return this.skillRepository.findByName(name);
  }

  async create(name: string, description?: string): Promise<Skill> {
    const skill = this.skillRepository.create({ name, description });
    return this.skillRepository.save(skill);
  }

  async validateSkillsExist(
    skillIds: number[],
  ): Promise<{ valid: boolean; invalidIds: number[] }> {
    if (!skillIds || skillIds.length === 0) {
      return { valid: true, invalidIds: [] };
    }

    const skills = await this.findByIds(skillIds);
    const foundSkillIds = skills.map((skill) => skill.id);
    const invalidIds = skillIds.filter((id) => !foundSkillIds.includes(id));

    return {
      valid: invalidIds.length === 0,
      invalidIds,
    };
  }
}
