import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserPlanResponseDto } from '../../dto/user-plan-response.dto';
import { PlanRepository } from '../../repository/plan.repository';
import { SubscriptionRepository } from '../../repository/subscription.repository';

@Injectable()
export class GetUserPlanUseCase {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly plans: PlanRepository,
  ) {}

  async execute(userId: number): Promise<UserPlanResponseDto> {
    // 1. Buscar última suscripción activa del usuario
    const activeSubscription =
      await this.subscriptions.findActiveByUserId(userId);

    // 2. Si tiene suscripción activa, retornar plan + info suscripción
    if (activeSubscription && activeSubscription.plan) {
      // Obtener el plan enriquecido con los benefits completos (key, value, name)
      const enrichedPlan = await this.plans.findById(
        activeSubscription.plan.id,
        true,
      );

      const planBenefits = enrichedPlan?.benefits
        ? this.formatBenefits(enrichedPlan.benefits)
        : [];

      return {
        plan: {
          id: activeSubscription.plan.id,
          name: activeSubscription.plan.name,
          description: activeSubscription.plan.description,
          monthlyPrice: Number(activeSubscription.plan.monthlyPrice),
          annualPrice: Number(activeSubscription.plan.annualPrice),
          benefits: planBenefits,
        },
        subscription: {
          id: activeSubscription.id,
          status: activeSubscription.status,
          billingCycle: activeSubscription.billingCycle,
          startDate: activeSubscription.startDate,
          endDate: activeSubscription.endDate,
          nextPaymentDate: activeSubscription.nextPaymentDate,
        },
        isFreePlan: false,
      };
    }

    // 3. Si no tiene suscripción activa, buscar plan Free
    const freePlan = await this.plans.findFreePlan();

    // 4. Si no existe el plan Free, lanzar excepción
    if (!freePlan) {
      throw new RpcException({
        statusCode: 500,
        message:
          'Free plan not found in database. Please contact system administrator.',
      });
    }

    // 5. Retornar plan Free
    return {
      plan: {
        id: freePlan.id,
        name: freePlan.name,
        description: freePlan.description,
        monthlyPrice: Number(freePlan.monthlyPrice),
        annualPrice: Number(freePlan.annualPrice),
        benefits: this.formatBenefits(freePlan.benefits),
      },
      isFreePlan: true,
    };
  }

  private formatBenefits(
    benefits: Array<{ key: string; value: unknown; name?: string }> | undefined,
  ): Array<{ key: string; value: unknown; name: string }> {
    if (!benefits || !Array.isArray(benefits)) {
      return [];
    }

    return benefits.map((benefit) => ({
      key: benefit.key,
      value: benefit.value,
      name: benefit.name || benefit.key,
    }));
  }
}
