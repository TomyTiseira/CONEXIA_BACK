import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { TogglePlanDto } from '../dto/toggle-plan.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { MembreshipsService } from '../services/membreships.service';

@Controller()
export class MembreshipsController {
  constructor(private readonly membreshipsService: MembreshipsService) {}

  // Benefits catalog
  @MessagePattern('getBenefits')
  getBenefits() {
    return this.membreshipsService.getBenefits();
  }

  // Plans CRUD
  @MessagePattern('createPlan')
  createPlan(@Payload() dto: CreatePlanDto) {
    return this.membreshipsService.createPlan(dto);
  }

  @MessagePattern('getPlans')
  getPlans() {
    return this.membreshipsService.getPlans();
  }

  @MessagePattern('getPlanById')
  getPlanById(@Payload() id: number) {
    return this.membreshipsService.getPlanById(id);
  }

  @MessagePattern('updatePlan')
  updatePlan(@Payload() dto: UpdatePlanDto) {
    return this.membreshipsService.updatePlan(dto);
  }

  @MessagePattern('togglePlan')
  togglePlan(@Payload() dto: TogglePlanDto) {
    return this.membreshipsService.togglePlan(dto);
  }

  @MessagePattern('deletePlan')
  deletePlan(@Payload() data: { id: number; adminUserId: number }) {
    return this.membreshipsService.deletePlan(data.id, data.adminUserId);
  }

  @MessagePattern('memberships_ping')
  ping() {
    return this.membreshipsService.ping();
  }
}
