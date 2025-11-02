import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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

  findAll(includeInactive = false) {
    const where: { deletedAt: any; active?: boolean } = {
      deletedAt: IsNull(),
    };
    if (!includeInactive) {
      where.active = true;
    }
    return this.repo.find({ where });
  }

  findById(id: number, includeInactive = false) {
    const where: { id: number; active?: boolean } = { id };
    if (!includeInactive) {
      where.active = true;
    }
    return this.repo.findOne({ where });
  }

  async softDelete(id: number) {
    await this.repo.softDelete(id);
  }
}
