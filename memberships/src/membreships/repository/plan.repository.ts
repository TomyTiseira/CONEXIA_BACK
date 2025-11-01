import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../entities/plan.entity';

@Injectable()
export class PlanRepository {
  constructor(
    @InjectRepository(Plan)
    private readonly repo: Repository<Plan>,
  ) {}

  create(data: Partial<Plan>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Plan>) {
    const plan = await this.repo.findOne({ where: { id } });
    if (!plan) return null;
    const merged = this.repo.merge(plan, data);
    return this.repo.save(merged);
  }

  findAll() {
    return this.repo.find({ where: { deletedAt: null } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async softDelete(id: number) {
    await this.repo.softDelete(id);
  }
}
