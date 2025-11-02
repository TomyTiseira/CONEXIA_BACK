import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Benefit } from '../entities/benefit.entity';

@Injectable()
export class BenefitRepository {
  constructor(
    @InjectRepository(Benefit)
    private readonly repo: Repository<Benefit>,
  ) {}

  upsertByKey(key: string, data: Partial<Benefit>) {
    return this.repo
      .createQueryBuilder()
      .insert()
      .into(Benefit)
      .values({ key, ...data })
      .orUpdate(['name', 'description', 'type', 'options', 'active'], ['key'])
      .execute();
  }

  findAllActive() {
    return this.repo.find({ where: { active: true } });
  }

  findByKey(key: string) {
    return this.repo.findOne({ where: { key } });
  }
}
