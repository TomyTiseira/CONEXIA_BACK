import { Injectable } from '@nestjs/common';
import {
  BenefitNotFoundException,
  PlanNotFoundException,
} from '../../../common/exceptions';
import { UpdatePlanDto } from '../../dto/update-plan.dto';
import { BenefitRepository } from '../../repository/benefit.repository';
import { PlanLogRepository } from '../../repository/plan-log.repository';
import { PlanRepository } from '../../repository/plan.repository';

@Injectable()
export class UpdatePlanUseCase {
  constructor(
    private readonly plans: PlanRepository,
    private readonly benefits: BenefitRepository,
    private readonly logs: PlanLogRepository,
  ) {}

  async execute(dto: UpdatePlanDto) {
    // Incluir inactivos para poder actualizar planes desactivados
    const existing = await this.plans.findById(dto.id, true);
    if (!existing) throw new PlanNotFoundException(dto.id);

    if (dto.benefits) {
      for (const b of dto.benefits) {
        const exists = await this.benefits.findByKey(b.key);
        if (!exists) throw new BenefitNotFoundException(b.key);
      }
    }

    const updated = await this.plans.update(dto.id, {
      name: dto.name ?? existing.name,
      description: dto.description ?? existing.description,
      monthlyPrice: dto.monthlyPrice ?? existing.monthlyPrice,
      annualPrice: dto.annualPrice ?? existing.annualPrice,
      benefits: dto.benefits ?? existing.benefits,
      active: dto.active ?? existing.active,
    });
    if (!updated) throw new PlanNotFoundException(dto.id);

    await this.logs.createLog({
      adminUserId: dto.adminUserId,
      action: 'update',
      changes: { before: existing, after: updated },
    });

    return updated;
  }
}
