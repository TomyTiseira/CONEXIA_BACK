import { Injectable, Logger } from '@nestjs/common';
import { BillingCycle } from '../../entities/membreship.entity';
import { PlanRepository } from '../../repository/plan.repository';
import { MercadoPagoService } from '../mercado-pago.service';

@Injectable()
export class SyncPlanWithMercadoPagoUseCase {
  private readonly logger = new Logger(SyncPlanWithMercadoPagoUseCase.name);

  constructor(
    private readonly planRepository: PlanRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(planId: number): Promise<void> {
    try {
      this.logger.log(`Sincronizando plan ${planId} con MercadoPago`);

      const plan = await this.planRepository.findById(planId);

      if (!plan) {
        throw new Error(`Plan ${planId} no encontrado`);
      }

      // Verificar si ya tiene planes de MercadoPago creados
      if (plan.mercadoPagoPlanIdMonthly && plan.mercadoPagoPlanIdAnnual) {
        this.logger.log(`Plan ${planId} ya está sincronizado con MercadoPago`);
        return;
      }

      // Crear plan mensual en MercadoPago si no existe
      let monthlyPlanId = plan.mercadoPagoPlanIdMonthly;
      if (!monthlyPlanId && plan.monthlyPrice > 0) {
        this.logger.log(
          `Creando plan mensual en MercadoPago para plan ${planId}`,
        );

        const { planId: mpMonthlyPlanId } =
          await this.mercadoPagoService.createSubscriptionPlan(
            plan.name,
            plan.description || `Suscripción a ${plan.name}`,
            plan.monthlyPrice,
            BillingCycle.MONTHLY,
          );

        monthlyPlanId = mpMonthlyPlanId;
        this.logger.log(
          `Plan mensual creado en MercadoPago: ${mpMonthlyPlanId}`,
        );
      }

      // Crear plan anual en MercadoPago si no existe
      let annualPlanId = plan.mercadoPagoPlanIdAnnual;
      if (!annualPlanId && plan.annualPrice > 0) {
        this.logger.log(
          `Creando plan anual en MercadoPago para plan ${planId}`,
        );

        const { planId: mpAnnualPlanId } =
          await this.mercadoPagoService.createSubscriptionPlan(
            plan.name,
            plan.description || `Suscripción a ${plan.name}`,
            plan.annualPrice,
            BillingCycle.ANNUAL,
          );

        annualPlanId = mpAnnualPlanId;
        this.logger.log(`Plan anual creado en MercadoPago: ${mpAnnualPlanId}`);
      }

      // Actualizar el plan con los IDs de MercadoPago
      await this.planRepository.update(planId, {
        mercadoPagoPlanIdMonthly: monthlyPlanId,
        mercadoPagoPlanIdAnnual: annualPlanId,
      });

      this.logger.log(
        `Plan ${planId} sincronizado exitosamente con MercadoPago`,
      );
    } catch (error) {
      this.logger.error(
        `Error al sincronizar plan ${planId} con MercadoPago: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
