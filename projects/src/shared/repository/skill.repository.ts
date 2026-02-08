import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { Skill } from '../entities/skill.entity';

@Injectable()
export class SkillRepository extends Repository<Skill> {
  constructor(private dataSource: DataSource) {
    super(Skill, dataSource.createEntityManager());
  }

  async findByIds(ids: number[]): Promise<Skill[]> {
    return this.find({ where: { id: In(ids) } });
  }

  async findByName(name: string): Promise<Skill | null> {
    return this.findOne({ where: { name } });
  }

  async findAll(): Promise<Skill[]> {
    return this.find();
  }

  async findById(id: number): Promise<Skill | null> {
    return this.findOne({ where: { id } });
  }
}
