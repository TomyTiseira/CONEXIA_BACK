import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembreshipsController } from './controllers/membreships.controller';
import { Benefit } from './entities/benefit.entity';
import { Membreship } from './entities/membreship.entity';
import { PlanLog } from './entities/plan-log.entity';
import { Plan } from './entities/plan.entity';
import { BenefitRepository } from './repository/benefit.repository';
import { PlanLogRepository } from './repository/plan-log.repository';
import { PlanRepository } from './repository/plan.repository';
import { PingUseCase } from './service/use-cases/ping.use-case';
import { MembreshipsService } from './services/membreships.service';
import { MembreshipRepository } from './repository/membreship.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, Benefit, PlanLog, Membreship])],
  controllers: [MembreshipsController],
  providers: [MembreshipsService, MembreshipRepository, PingUseCase],
  exports: [
    MembreshipRepository,
    MembreshipsService,
    PlanRepository,
    BenefitRepository,
    PlanLogRepository,
  ],
})
export class MembreshipsModule {}
