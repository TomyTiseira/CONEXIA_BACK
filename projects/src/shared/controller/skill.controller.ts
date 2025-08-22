import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Skill } from '../entities/skill.entity';
import { SkillService } from '../services/skill.service';

@Controller('skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @MessagePattern('getSkills')
  async findAll(): Promise<Skill[]> {
    return this.skillService.findAll();
  }

  @MessagePattern('getSkillById')
  async findOne(@Param('id') id: string): Promise<Skill> {
    const skill = await this.skillService.findById(parseInt(id));
    if (!skill) {
      throw new Error('Skill not found');
    }
    return skill;
  }

  @MessagePattern('findSkillsByIds')
  async findSkillsByIds(@Payload() data: { ids: number[] }): Promise<Skill[]> {
    return this.skillService.findByIds(data.ids);
  }

  @MessagePattern('getSkillByName')
  async findByName(@Payload() data: { name: string }): Promise<Skill | null> {
    return this.skillService.findByName(data.name);
  }

  @MessagePattern('validateSkillsExist')
  async validateSkillsExist(
    @Payload() data: { skillIds: number[] },
  ): Promise<{ valid: boolean; invalidIds: number[] }> {
    return this.skillService.validateSkillsExist(data.skillIds);
  }
}
