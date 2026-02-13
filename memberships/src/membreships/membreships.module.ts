import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NatsModule } from '../transports/nats.module';
import { DashboardController } from './controllers/dashboard.controller';
import { MembershipsController } from './controllers/membreships.controller';
import { Benefit } from './entities/benefit.entity';
import { Subscription } from './entities/membreship.entity';
import { PlanLog } from './entities/plan-log.entity';
import { Plan } from './entities/plan.entity';
import { BenefitRepository } from './repository/benefit.repository';
import { PlanLogRepository } from './repository/plan-log.repository';
import { PlanRepository } from './repository/plan.repository';
import { SubscriptionRepository } from './repository/subscription.repository';
import { MembershipsService } from './services/membreships.service';
import { MercadoPagoService } from './services/mercado-pago.service';
import { CancelUserSubscriptionUseCase } from './services/use-cases/cancel-user-subscription.use-case';
import { ContractPlanUseCase } from './services/use-cases/contract-plan.use-case';
import { CreatePlanUseCase } from './services/use-cases/create-plan.use-case';
import { DeletePlanUseCase } from './services/use-cases/delete-plan.use-case';
import { GetAdminMembershipMetricsUseCase } from './services/use-cases/get-admin-membership-metrics.use-case';
import { GetBenefitsUseCase } from './services/use-cases/get-benefits.use-case';
import { GetPlanByIdUseCase } from './services/use-cases/get-plan-by-id.use-case';
import { GetPlansUseCase } from './services/use-cases/get-plans.use-case';
import { GetUserPlanUseCase } from './services/use-cases/get-user-plan.use-case';
import { HealthUseCase } from './services/use-cases/health.use-case';
import { ProcessPreapprovalWebhookUseCase } from './services/use-cases/process-preapproval-webhook.use-case';
import { ProcessSubscriptionInvoiceWebhookUseCase } from './services/use-cases/process-subscription-invoice-webhook.use-case';
import { ProcessSubscriptionPaymentWebhookUseCase } from './services/use-cases/process-subscription-payment-webhook.use-case';
import { SubscriptionSchedulerService } from './services/subscription-scheduler.service';
import { SyncPlanWithMercadoPagoUseCase } from './services/use-cases/sync-plan-with-mercadopago.use-case';
import { TogglePlanUseCase } from './services/use-cases/toggle-plan.use-case';
import { UpdatePlanUseCase } from './services/use-cases/update-plan.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, Benefit, PlanLog, Subscription]),
    NatsModule,
  ],
  controllers: [MembershipsController, DashboardController],
  providers: [
    MembershipsService,
    PlanRepository,
    BenefitRepository,
    PlanLogRepository,
    SubscriptionRepository,
    MercadoPagoService,
    GetBenefitsUseCase,
    CreatePlanUseCase,
    GetPlansUseCase,
    GetPlanByIdUseCase,
    UpdatePlanUseCase,
    TogglePlanUseCase,
    DeletePlanUseCase,
    HealthUseCase,
    ContractPlanUseCase,
    ProcessSubscriptionPaymentWebhookUseCase,
    ProcessSubscriptionInvoiceWebhookUseCase,
    ProcessPreapprovalWebhookUseCase,
    SyncPlanWithMercadoPagoUseCase,
    GetUserPlanUseCase,
    GetAdminMembershipMetricsUseCase,
    CancelUserSubscriptionUseCase,
    SubscriptionSchedulerService,
  ],
  exports: [
    MembershipsService,
    PlanRepository,
    BenefitRepository,
    PlanLogRepository,
    SubscriptionRepository,
  ],
})
export class MembershipsModule {}
