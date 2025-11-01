import { Injectable } from '@nestjs/common';
import {
  PlanBadRequestException,
  PlanNotFoundException,
} from 'src/common/exceptions';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { TogglePlanDto } from '../dto/toggle-plan.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { BenefitRepository } from '../repository/benefit.repository';
import { PlanLogRepository } from '../repository/plan-log.repository';
import { PlanRepository } from '../repository/plan.repository';

@Injectable()
export class MembreshipsService {
  constructor(
    private readonly plans: PlanRepository,
    private readonly benefits: BenefitRepository,
    private readonly logs: PlanLogRepository,
  ) {}

  // Benefits catalog
  async getBenefits() {
    return this.benefits.findAllActive();
  }

  // Plans CRUD
  async createPlan(dto: CreatePlanDto) {
    // basic validation
    if (dto.monthlyPrice < 0 || dto.annualPrice < 0) {
      throw new PlanBadRequestException('Prices must be positive numbers');
    }

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
  }

  getPlans() {
    return this.plans.findAll();
  }

  async getPlanById(id: number) {
    const plan = await this.plans.findById(id);
    if (!plan) throw new PlanNotFoundException(id);
    return plan;
  }

  async updatePlan(dto: UpdatePlanDto) {
    const existing = await this.plans.findById(dto.id);
    if (!existing) throw new PlanNotFoundException(dto.id);

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

  async togglePlan(dto: TogglePlanDto) {
    const existing = await this.plans.findById(dto.id);
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

  async deletePlan(id: number, adminUserId: number) {
    const existing = await this.plans.findById(id);
    if (!existing) throw new PlanNotFoundException(id);

    await this.plans.softDelete(id);
    await this.logs.createLog({
      adminUserId,
      action: 'delete',
      changes: { id },
    });
    return { id, deleted: true };
  }

  ping() {
    return 'pong from memberships service';
  }
}
