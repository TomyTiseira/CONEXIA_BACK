import { Injectable } from '@nestjs/common';
import { ContractPlanDto } from '../dto/contract-plan.dto';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { TogglePlanDto } from '../dto/toggle-plan.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { CancelUserSubscriptionUseCase } from './use-cases/cancel-user-subscription.use-case';
import { ContractPlanUseCase } from './use-cases/contract-plan.use-case';
import { CreatePlanUseCase } from './use-cases/create-plan.use-case';
import { DeletePlanUseCase } from './use-cases/delete-plan.use-case';
import { GetAdminMembershipMetricsUseCase } from './use-cases/get-admin-membership-metrics.use-case';
import { GetBenefitsUseCase } from './use-cases/get-benefits.use-case';
import { GetPlanByIdUseCase } from './use-cases/get-plan-by-id.use-case';
import { GetPlansUseCase } from './use-cases/get-plans.use-case';
import { GetUserPlanUseCase } from './use-cases/get-user-plan.use-case';
import { HealthUseCase } from './use-cases/health.use-case';
import { ProcessPreapprovalWebhookUseCase } from './use-cases/process-preapproval-webhook.use-case';
import { ProcessSubscriptionInvoiceWebhookUseCase } from './use-cases/process-subscription-invoice-webhook.use-case';
import { ProcessSubscriptionPaymentWebhookUseCase } from './use-cases/process-subscription-payment-webhook.use-case';
import { TogglePlanUseCase } from './use-cases/toggle-plan.use-case';
import { UpdatePlanUseCase } from './use-cases/update-plan.use-case';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly getBenefitsUC: GetBenefitsUseCase,
    private readonly createPlanUC: CreatePlanUseCase,
    private readonly getPlansUC: GetPlansUseCase,
    private readonly getPlanByIdUC: GetPlanByIdUseCase,
    private readonly updatePlanUC: UpdatePlanUseCase,
    private readonly togglePlanUC: TogglePlanUseCase,
    private readonly deletePlanUC: DeletePlanUseCase,
    private readonly healthUC: HealthUseCase,
    private readonly contractPlanUC: ContractPlanUseCase,
    private readonly processSubscriptionPaymentWebhookUC: ProcessSubscriptionPaymentWebhookUseCase,
    private readonly processSubscriptionInvoiceWebhookUC: ProcessSubscriptionInvoiceWebhookUseCase,
    private readonly processPreapprovalWebhookUC: ProcessPreapprovalWebhookUseCase,
    private readonly getUserPlanUC: GetUserPlanUseCase,
    private readonly getAdminMembershipMetricsUC: GetAdminMembershipMetricsUseCase,
    private readonly cancelUserSubscriptionUC: CancelUserSubscriptionUseCase,
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

  // Subscriptions
  async contractPlan(
    userId: number,
    userEmail: string,
    userRole: string,
    dto: ContractPlanDto,
  ) {
    return this.contractPlanUC.execute(userId, userEmail, userRole, dto);
  }

  async processSubscriptionPaymentWebhook(
    paymentId: number,
  ): Promise<{ success: boolean; message?: string }> {
    return this.processSubscriptionPaymentWebhookUC.execute(paymentId);
  }

  async processSubscriptionInvoiceWebhook(authorizedPaymentId: string) {
    return this.processSubscriptionInvoiceWebhookUC.execute(
      authorizedPaymentId,
    );
  }

  async processPreapprovalWebhook(preapprovalId: string, action: string) {
    return this.processPreapprovalWebhookUC.execute(preapprovalId, action);
  }

  // User Plan
  async getUserPlan(userId: number) {
    return this.getUserPlanUC.execute(userId);
  }

  // Confirm subscription after payment (called from frontend)
  async confirmSubscription(subscriptionId: number, preapprovalId: string) {
    return this.processPreapprovalWebhookUC.execute(
      preapprovalId,
      'created',
      subscriptionId,
    );
  }

  // Cancel user subscription
  async cancelMySubscription(userId: number, reason?: string) {
    return this.cancelUserSubscriptionUC.execute(userId, reason);
  }

  // Admin metrics
  async getAdminMetrics() {
    return this.getAdminMembershipMetricsUC.execute();
  }
}
