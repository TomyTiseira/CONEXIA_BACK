import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import { UserPlanResponseDto } from '../../dto/user-plan-response.dto';
import { PlanRepository } from '../../repository/plan.repository';
import { SubscriptionRepository } from '../../repository/subscription.repository';

@Injectable()
export class GetUserPlanUseCase {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly plans: PlanRepository,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async execute(userId: number): Promise<UserPlanResponseDto> {
    // 1. Obtener información del usuario (fecha de registro)
    const userInfo = await this.getUserInfo(userId);
    const memberSince = userInfo?.createdAt || new Date();

    // 2. Buscar última suscripción activa del usuario
    const activeSubscription =
      await this.subscriptions.findActiveByUserId(userId);

    // 3. Si tiene suscripción activa, retornar plan + info suscripción
    if (activeSubscription && activeSubscription.plan) {
      // Obtener el plan enriquecido con los benefits completos (key, value, name)
      const enrichedPlan = await this.plans.findById(
        activeSubscription.plan.id,
        true,
      );

      const planBenefits = enrichedPlan?.benefits
        ? this.formatBenefits(enrichedPlan.benefits)
        : [];

      // Verificar si es plan Free (precio 0 en ambos ciclos)
      // Convertir a número para comparación correcta
      const monthlyPrice = Number(activeSubscription.plan.monthlyPrice);
      const annualPrice = Number(activeSubscription.plan.annualPrice);
      const isFreePlan = monthlyPrice === 0 && annualPrice === 0;

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
          price: Number(activeSubscription.price),
        },
        paymentInfo: {
          nextPaymentAmount: Number(activeSubscription.price),
          nextPaymentDate: activeSubscription.nextPaymentDate,
          paymentMethod: activeSubscription.paymentMethodType
            ? {
                type: activeSubscription.paymentMethodType,
                lastFourDigits: activeSubscription.cardLastFourDigits,
                brand: activeSubscription.cardBrand,
              }
            : null,
        },
        memberSince,
        isFreePlan,
      };
    }

    // 4. Si no tiene suscripción activa, buscar plan Free
    const freePlan = await this.plans.findFreePlan();

    // 5. Si no existe el plan Free, lanzar excepción
    if (!freePlan) {
      throw new RpcException({
        statusCode: 500,
        message:
          'Free plan not found in database. Please contact system administrator.',
      });
    }

    // 6. Retornar plan Free
    return {
      plan: {
        id: freePlan.id,
        name: freePlan.name,
        description: freePlan.description,
        monthlyPrice: Number(freePlan.monthlyPrice),
        annualPrice: Number(freePlan.annualPrice),
        benefits: this.formatBenefits(freePlan.benefits),
      },
      memberSince,
      isFreePlan: true,
    };
  }

  private async getUserInfo(
    userId: number,
  ): Promise<{ createdAt: Date } | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const user = await this.client.send('findUserById', userId).toPromise();
      return user && user.createdAt
        ? { createdAt: new Date(user.createdAt) }
        : null;
    } catch {
      // Si falla la consulta al microservicio de users, retornar null
      // El código seguirá funcionando usando la fecha actual como fallback
      return null;
    }
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
