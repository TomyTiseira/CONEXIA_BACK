import { Injectable } from '@nestjs/common';
import { PlanNotFoundException } from 'src/common/exceptions';
import { PlanRepository } from '../../repository/plan.repository';

export interface GetPlanByIdDto {
  id: number;
  includeInactive?: boolean;
}

@Injectable()
export class GetPlanByIdUseCase {
  constructor(private readonly plans: PlanRepository) {}

  async execute(dto: GetPlanByIdDto) {
    const plan = await this.plans.findById(
      dto.id,
      dto.includeInactive ?? false,
    );
    if (!plan) throw new PlanNotFoundException(dto.id);
    return plan;
  }
}
