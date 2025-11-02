import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../../repository/plan.repository';

export interface GetPlansDto {
  includeInactive?: boolean;
}

@Injectable()
export class GetPlansUseCase {
  constructor(private readonly plans: PlanRepository) {}

  execute(dto: GetPlansDto = {}) {
    return this.plans.findAll(dto.includeInactive ?? false);
  }
}
