import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembreshipsController } from './controllers/membreships.controller';
import { Benefit } from './entities/benefit.entity';
import { PlanLog } from './entities/plan-log.entity';
import { Plan } from './entities/plan.entity';
import { BenefitRepository } from './repository/benefit.repository';
import { PlanLogRepository } from './repository/plan-log.repository';
import { PlanRepository } from './repository/plan.repository';
import { MembreshipsService } from './services/membreships.service';
import { CreatePlanUseCase } from './services/use-cases/create-plan.use-case';
import { DeletePlanUseCase } from './services/use-cases/delete-plan.use-case';
import { GetBenefitsUseCase } from './services/use-cases/get-benefits.use-case';
import { GetPlanByIdUseCase } from './services/use-cases/get-plan-by-id.use-case';
import { GetPlansUseCase } from './services/use-cases/get-plans.use-case';
import { HealthUseCase } from './services/use-cases/health.use-case';
import { TogglePlanUseCase } from './services/use-cases/toggle-plan.use-case';
import { UpdatePlanUseCase } from './services/use-cases/update-plan.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, Benefit, PlanLog])],
  controllers: [MembreshipsController],
  providers: [
    MembreshipsService,
    PlanRepository,
    BenefitRepository,
    PlanLogRepository,
    GetBenefitsUseCase,
    CreatePlanUseCase,
    GetPlansUseCase,
    GetPlanByIdUseCase,
    UpdatePlanUseCase,
    TogglePlanUseCase,
    DeletePlanUseCase,
    HealthUseCase,
  ],
  exports: [
    MembreshipsService,
    PlanRepository,
    BenefitRepository,
    PlanLogRepository,
  ],
})
export class MembreshipsModule {}
