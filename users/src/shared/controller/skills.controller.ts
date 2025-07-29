import { Body, Controller, Param } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Skill } from '../entities/skill.entity';
import { SkillRepository } from '../repository/skill.repository';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillRepo: SkillRepository) {}

  @MessagePattern('getSkills')
  async findAll(): Promise<Skill[]> {
    return this.skillRepo.find();
  }

  @MessagePattern('getSkillById')
  async findOne(@Param('id') id: string): Promise<Skill> {
    const skill = await this.skillRepo.findOne({ where: { id: parseInt(id) } });
    if (!skill) {
      throw new Error('Skill not found');
    }
    return skill;
  }

  @MessagePattern('createSkill')
  async create(
    @Body() createSkillDto: { name: string; description?: string },
  ): Promise<Skill> {
    return this.skillRepo.createSkill(
      createSkillDto.name,
      createSkillDto.description,
    );
  }

  @MessagePattern('updateSkill')
  async update(
    @Param('id') id: string,
    @Body() updateSkillDto: { name?: string; description?: string },
  ): Promise<Skill> {
    await this.skillRepo.update(parseInt(id), updateSkillDto);
    const skill = await this.skillRepo.findOne({ where: { id: parseInt(id) } });
    if (!skill) {
      throw new Error('Skill not found');
    }
    return skill;
  }

  @MessagePattern('deleteSkill')
  async remove(@Param('id') id: string): Promise<void> {
    await this.skillRepo.delete(parseInt(id));
  }
}
