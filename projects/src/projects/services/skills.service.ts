import { Injectable } from '@nestjs/common';
import {
  RubroNotFoundException,
  SkillsNotFoundException,
} from 'src/common/exceptions/skills.exceptions';
import { Rubro } from 'src/shared/entities/rubro.entity';
import { Skill } from 'src/shared/entities/skill.entity';
import { ProjectRepository } from '../repositories/project.repository';

@Injectable()
export class SkillsService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async getSkillsByRubro(rubroId: number): Promise<Skill[]> {
    const rubro = await this.projectRepository.findRubroById(rubroId);
    if (!rubro) {
      throw new RubroNotFoundException(rubroId);
    }

    const skills = await this.projectRepository.getSkillsByRubro(rubroId);
    if (skills.length === 0) {
      throw new SkillsNotFoundException(rubroId);
    }
    return skills;
  }

  async getRubros(): Promise<Rubro[]> {
    return await this.projectRepository.getRubros();
  }
}
