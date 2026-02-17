import { Injectable, Logger } from '@nestjs/common';
import { BillingCycle } from '../../entities/membreship.entity';
import { PlanRepository } from '../../repository/plan.repository';
import { MercadoPagoService } from '../mercado-pago.service';

@Injectable()
export class UpdateMercadoPagoPlansUseCase {
  private readonly logger = new Logger(UpdateMercadoPagoPlansUseCase.name);

  constructor(
    private readonly planRepository: PlanRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(): Promise<{ updated: number; errors: string[] }> {
    try {
      this.logger.log('🔄 Actualizando todos los planes de MercadoPago...');

      const plans = await this.planRepository.findAll();
      let updatedCount = 0;
      const errors: string[] = [];

      for (const plan of plans) {
        try {
          // Actualizar plan mensual si existe
          if (plan.mercadoPagoPlanIdMonthly) {
            this.logger.log(
              `Actualizando plan mensual ${plan.mercadoPagoPlanIdMonthly} para ${plan.name}`,
            );
            await this.mercadoPagoService.updateSubscriptionPlan(
              plan.mercadoPagoPlanIdMonthly,
              plan.name,
              plan.description,
              plan.monthlyPrice,
              BillingCycle.MONTHLY,
            );
            updatedCount++;
          }

          // Actualizar plan anual si existe
          if (plan.mercadoPagoPlanIdAnnual) {
            this.logger.log(
              `Actualizando plan anual ${plan.mercadoPagoPlanIdAnnual} para ${plan.name}`,
            );
            await this.mercadoPagoService.updateSubscriptionPlan(
              plan.mercadoPagoPlanIdAnnual,
              plan.name,
              plan.description,
              plan.annualPrice,
              BillingCycle.ANNUAL,
            );
            updatedCount++;
          }

          this.logger.log(`✅ Plan ${plan.name} actualizado`);
        } catch (error) {
          const errorMsg = `Error actualizando plan ${plan.name}: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      this.logger.log(
        `✅ Proceso completado. ${updatedCount} planes actualizados.`,
      );

      return {
        updated: updatedCount,
        errors,
      };
    } catch (error) {
      this.logger.error(
        `Error al actualizar planes de MercadoPago: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
