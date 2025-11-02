import { Injectable } from '@nestjs/common';
import {
  BenefitNotFoundException,
  PlanBadRequestException,
} from 'src/common/exceptions';
import { QueryFailedError } from 'typeorm';
import { CreatePlanDto } from '../../dto/create-plan.dto';
import { BenefitRepository } from '../../repository/benefit.repository';
import { PlanLogRepository } from '../../repository/plan-log.repository';
import { PlanRepository } from '../../repository/plan.repository';

@Injectable()
export class CreatePlanUseCase {
  constructor(
    private readonly plans: PlanRepository,
    private readonly benefits: BenefitRepository,
    private readonly logs: PlanLogRepository,
  ) {}

  async execute(dto: CreatePlanDto) {
    if (dto.monthlyPrice < 0 || dto.annualPrice < 0) {
      throw new PlanBadRequestException('Prices must be positive numbers');
    }

    // validate benefit keys
    for (const b of dto.benefits ?? []) {
      const exists = await this.benefits.findByKey(b.key);
      if (!exists) throw new BenefitNotFoundException(b.key);
    }

    try {
      const created = await this.plans.create({
        name: dto.name,
        description: dto.description,
        monthlyPrice: dto.monthlyPrice,
        annualPrice: dto.annualPrice,
        benefits: dto.benefits,
        active: dto.active ?? true,
      });

      await this.logs.createLog({
        adminUserId: dto.adminUserId,
        action: 'create',
        changes: { id: created.id, ...dto },
      });

      return created;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        'code' in error.driverError &&
        error.driverError.code === '23505'
      ) {
        throw new PlanBadRequestException(
          `A plan with the name "${dto.name}" already exists`,
        );
      }
      throw error;
    }
  }
}
