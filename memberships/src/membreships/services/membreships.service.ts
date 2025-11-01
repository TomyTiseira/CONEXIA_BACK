import { Injectable } from '@nestjs/common';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { TogglePlanDto } from '../dto/toggle-plan.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { CreatePlanUseCase } from './use-cases/create-plan.use-case';
import { DeletePlanUseCase } from './use-cases/delete-plan.use-case';
import { GetBenefitsUseCase } from './use-cases/get-benefits.use-case';
import { GetPlanByIdUseCase } from './use-cases/get-plan-by-id.use-case';
import { GetPlansUseCase } from './use-cases/get-plans.use-case';
import { HealthUseCase } from './use-cases/health.use-case';
import { TogglePlanUseCase } from './use-cases/toggle-plan.use-case';
import { UpdatePlanUseCase } from './use-cases/update-plan.use-case';

@Injectable()
export class MembreshipsService {
  constructor(
    private readonly getBenefitsUC: GetBenefitsUseCase,
    private readonly createPlanUC: CreatePlanUseCase,
    private readonly getPlansUC: GetPlansUseCase,
    private readonly getPlanByIdUC: GetPlanByIdUseCase,
    private readonly updatePlanUC: UpdatePlanUseCase,
    private readonly togglePlanUC: TogglePlanUseCase,
    private readonly deletePlanUC: DeletePlanUseCase,
    private readonly healthUC: HealthUseCase,
  ) {}

  // Benefits catalog
  async getBenefits() {
    return this.getBenefitsUC.execute();
  }

  // Plans CRUD
  async createPlan(dto: CreatePlanDto) {
    return this.createPlanUC.execute(dto);
  }

  getPlans(dto: { includeInactive?: boolean } = {}) {
    return this.getPlansUC.execute(dto);
  }

  async getPlanById(dto: { id: number; includeInactive?: boolean }) {
    return this.getPlanByIdUC.execute(dto);
  }

  async updatePlan(dto: UpdatePlanDto) {
    return this.updatePlanUC.execute(dto);
  }

  async togglePlan(dto: TogglePlanDto) {
    return this.togglePlanUC.execute(dto);
  }

  async deletePlan(id: number, adminUserId: number) {
    return this.deletePlanUC.execute(id, adminUserId);
  }

  ping() {
    return this.healthUC.execute();
  }
}
