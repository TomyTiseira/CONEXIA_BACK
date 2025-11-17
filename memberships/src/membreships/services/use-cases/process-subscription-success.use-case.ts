import { Injectable, Logger } from '@nestjs/common';
import {
  BillingCycle,
  SubscriptionStatus,
} from '../../entities/membreship.entity';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { MercadoPagoService } from '../mercado-pago.service';

@Injectable()
export class ProcessSubscriptionSuccessUseCase {
  private readonly logger = new Logger(ProcessSubscriptionSuccessUseCase.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(
    paymentId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(
        `🎉 Procesando pago exitoso de suscripción: ${paymentId}`,
      );

      // 1. Obtener información del pago desde MercadoPago
      const paymentInfo = await this.mercadoPagoService.getPayment(paymentId);

      this.logger.log(
        `📋 Información del pago:`,
        JSON.stringify(paymentInfo, null, 2),
      );

      // 2. Buscar la suscripción por external_reference
      const externalReference = paymentInfo.external_reference;

      if (!externalReference) {
        throw new Error('El pago no tiene external_reference');
      }

      // El external_reference es el ID de la suscripción
      const subscriptionId = parseInt(externalReference);

      if (isNaN(subscriptionId)) {
        throw new Error(
          `external_reference no es un ID válido: ${externalReference}`,
        );
      }

      const subscription =
        await this.subscriptionRepository.findById(subscriptionId);

      if (!subscription) {
        throw new Error(`Suscripción ${subscriptionId} no encontrada`);
      }

      this.logger.log(`✅ Suscripción encontrada: ${subscription.id}`);

      // 3. Verificar si el pago fue aprobado
      if (paymentInfo.status !== 'approved') {
        this.logger.warn(
          `⚠️ Pago ${paymentId} no está aprobado (status: ${paymentInfo.status})`,
        );
        return {
          success: false,
          message: `Pago pendiente de aprobación (${paymentInfo.status})`,
        };
      }

      // 4. Actualizar la suscripción
      const now = new Date();
      const endDate = new Date(now);

      // Calcular fecha de fin según el ciclo
      if (subscription.billingCycle === BillingCycle.MONTHLY) {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (subscription.billingCycle === BillingCycle.ANNUAL) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      await this.subscriptionRepository.update(subscription.id, {
        status: SubscriptionStatus.ACTIVE,
        paymentStatus: 'approved',
        startDate: now,
        endDate: endDate,
        nextPaymentDate: endDate,
      });

      this.logger.log(
        `✅ Suscripción ${subscription.id} activada exitosamente`,
      );

      return {
        success: true,
        message: 'Suscripción activada exitosamente',
      };
    } catch (error) {
      this.logger.error(
        `❌ Error al procesar pago de suscripción ${paymentId}:`,
        error,
      );
      throw error;
    }
  }
}
