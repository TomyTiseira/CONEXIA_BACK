import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContractPlanDto } from '../dto/contract-plan.dto';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { TogglePlanDto } from '../dto/toggle-plan.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { MembershipsService } from '../services/membreships.service';

@Controller()
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  // Benefits catalog
  @MessagePattern('getBenefits')
  getBenefits() {
    return this.membershipsService.getBenefits();
  }

  // Plans CRUD
  @MessagePattern('createPlan')
  createPlan(@Payload() dto: CreatePlanDto) {
    return this.membershipsService.createPlan(dto);
  }

  @MessagePattern('getPlans')
  getPlans(@Payload() dto: { includeInactive?: boolean }) {
    return this.membershipsService.getPlans(dto);
  }

  @MessagePattern('getPlanById')
  getPlanById(@Payload() dto: { id: number; includeInactive?: boolean }) {
    return this.membershipsService.getPlanById(dto);
  }

  @MessagePattern('updatePlan')
  updatePlan(@Payload() dto: UpdatePlanDto) {
    return this.membershipsService.updatePlan(dto);
  }

  @MessagePattern('togglePlan')
  togglePlan(@Payload() dto: TogglePlanDto) {
    return this.membershipsService.togglePlan(dto);
  }

  @MessagePattern('deletePlan')
  deletePlan(@Payload() data: { id: number; adminUserId: number }) {
    return this.membershipsService.deletePlan(data.id, data.adminUserId);
  }

  @MessagePattern('memberships_ping')
  ping() {
    return this.membershipsService.ping();
  }

  // Subscriptions
  @MessagePattern('contractPlan')
  contractPlan(
    @Payload()
    data: {
      userId: number;
      userEmail: string;
      userRole: string;
      dto: ContractPlanDto;
    },
  ) {
    return this.membershipsService.contractPlan(
      data.userId,
      data.userEmail,
      data.userRole,
      data.dto,
    );
  }

  @MessagePattern('processSubscriptionPaymentWebhook')
  processSubscriptionPaymentWebhook(@Payload() data: { paymentId: number }) {
    return this.membershipsService.processSubscriptionPaymentWebhook(
      data.paymentId,
    );
  }

  @MessagePattern('processSubscriptionInvoiceWebhook')
  processSubscriptionInvoiceWebhook(
    @Payload() data: { authorizedPaymentId: string },
  ) {
    return this.membershipsService.processSubscriptionInvoiceWebhook(
      data.authorizedPaymentId,
    );
  }

  @MessagePattern('processPreapprovalWebhook')
  processPreapprovalWebhook(
    @Payload() data: { preapprovalId: string; action: string },
  ) {
    return this.membershipsService.processPreapprovalWebhook(
      data.preapprovalId,
      data.action,
    );
  }

  // User Plan
  @MessagePattern('getUserPlan')
  getUserPlan(@Payload() data: { userId: number }) {
    return this.membershipsService.getUserPlan(data.userId);
  }

  // Confirm subscription after payment (called from frontend)
  @MessagePattern('confirmSubscription')
  confirmSubscription(
    @Payload()
    data: {
      subscriptionId: number;
      preapprovalId: string;
    },
  ) {
    return this.membershipsService.confirmSubscription(
      data.subscriptionId,
      data.preapprovalId,
    );
  }

  // Cancel user subscription
  @MessagePattern('cancelMySubscription')
  cancelMySubscription(@Payload() data: { userId: number }) {
    return this.membershipsService.cancelMySubscription(data.userId);
  }
}
