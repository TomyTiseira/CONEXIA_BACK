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

@Module({
  imports: [TypeOrmModule.forFeature([Plan, Benefit, PlanLog])],
  controllers: [MembreshipsController],
  providers: [
    MembreshipsService,
    PlanRepository,
    BenefitRepository,
    PlanLogRepository,
  ],
})
export class MembreshipsModule {}
