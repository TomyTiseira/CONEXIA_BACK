import { Injectable } from '@nestjs/common';
import { PlanNotFoundException } from 'src/common/exceptions';
import { TogglePlanDto } from '../../dto/toggle-plan.dto';
import { PlanLogRepository } from '../../repository/plan-log.repository';
import { PlanRepository } from '../../repository/plan.repository';

@Injectable()
export class TogglePlanUseCase {
  constructor(
    private readonly plans: PlanRepository,
    private readonly logs: PlanLogRepository,
  ) {}

  async execute(dto: TogglePlanDto) {
    // Siempre incluir inactivos para poder togglear planes desactivados
    const existing = await this.plans.findById(dto.id, true);
    if (!existing) throw new PlanNotFoundException(dto.id);

    const updated = await this.plans.update(dto.id, { active: dto.active });
    if (!updated) throw new PlanNotFoundException(dto.id);

    await this.logs.createLog({
      adminUserId: dto.adminUserId,
      action: dto.active ? 'activate' : 'deactivate',
      changes: { id: dto.id, from: existing.active, to: dto.active },
    });
    return updated;
  }
}
