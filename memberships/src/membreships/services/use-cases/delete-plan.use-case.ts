import { Injectable } from '@nestjs/common';
import { PlanNotFoundException } from 'src/common/exceptions';
import { PlanLogRepository } from '../../repository/plan-log.repository';
import { PlanRepository } from '../../repository/plan.repository';

@Injectable()
export class DeletePlanUseCase {
  constructor(
    private readonly plans: PlanRepository,
    private readonly logs: PlanLogRepository,
  ) {}

  async execute(id: number, adminUserId: number) {
    // Incluir inactivos para poder eliminar planes desactivados
    const existing = await this.plans.findById(id, true);
    if (!existing) throw new PlanNotFoundException(id);

    await this.plans.softDelete(id);
    await this.logs.createLog({
      adminUserId,
      action: 'delete',
      changes: { id },
    });
    return { id, deleted: true };
  }
}
