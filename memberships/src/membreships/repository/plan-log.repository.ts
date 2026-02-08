import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanLog } from '../entities/plan-log.entity';

@Injectable()
export class PlanLogRepository {
  constructor(
    @InjectRepository(PlanLog)
    private readonly repo: Repository<PlanLog>,
  ) {}

  createLog(log: Partial<PlanLog>) {
    const entity = this.repo.create(log);
    return this.repo.save(entity);
  }
}
