import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '../../entities/membreship.entity';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { MercadoPagoService } from '../mercado-pago.service';

@Injectable()
export class ProcessPreapprovalWebhookUseCase {
  private readonly logger = new Logger(ProcessPreapprovalWebhookUseCase.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(preapprovalId: string, action: string): Promise<void> {
    try {
      this.logger.log(
        `🎉 Procesando webhook de preapproval ${preapprovalId}, acción: ${action}`,
      );

      // Obtener información del preapproval desde MercadoPago
      const preapprovalData =
        await this.mercadoPagoService.getSubscription(preapprovalId);

      this.logger.log(
        `📋 Preapproval data: ${JSON.stringify(preapprovalData)}`,
      );

      if (!preapprovalData.external_reference) {
        this.logger.warn(
          `Preapproval ${preapprovalId} no tiene external_reference`,
        );
        return;
      }

      const subscriptionId = parseInt(preapprovalData.external_reference, 10);

      // Obtener la suscripción
      const subscription =
        await this.subscriptionRepository.findById(subscriptionId);

      if (!subscription) {
        throw new NotFoundException(
          `Suscripción ${subscriptionId} no encontrada`,
        );
      }

      this.logger.log(
        `📝 Suscripción encontrada: ID ${subscriptionId}, estado actual: ${subscription.status}`,
      );

      // Procesar según la acción
      if (action === 'created' || preapprovalData.status === 'authorized') {
        // La suscripción fue autorizada exitosamente
        await this.activateSubscription(
          subscription.id,
          preapprovalId,
          preapprovalData,
        );
      } else if (preapprovalData.status === 'cancelled') {
        // La suscripción fue cancelada
        await this.cancelSubscription(subscription.id);
      } else if (preapprovalData.status === 'paused') {
        // La suscripción fue pausada
        await this.pauseSubscription(subscription.id);
      }

      this.logger.log(
        `✅ Webhook de preapproval procesado exitosamente para suscripción ${subscriptionId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error al procesar webhook de preapproval ${preapprovalId}:`,
        error.stack,
      );
      throw error;
    }
  }

  private async activateSubscription(
    subscriptionId: number,
    preapprovalId: string,
    preapprovalData: any,
  ): Promise<void> {
    this.logger.log(
      `✅ Activando suscripción ${subscriptionId} con preapproval ${preapprovalId}`,
    );

    const nextPaymentDate = preapprovalData.next_payment_date
      ? new Date(preapprovalData.next_payment_date)
      : null;

    await this.subscriptionRepository.update(subscriptionId, {
      mercadoPagoSubscriptionId: preapprovalId,
      paymentStatus: 'authorized',
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      nextPaymentDate,
    });

    this.logger.log(
      `✅ Suscripción ${subscriptionId} activada exitosamente. Próximo pago: ${nextPaymentDate}`,
    );
  }

  private async cancelSubscription(subscriptionId: number): Promise<void> {
    this.logger.log(`❌ Cancelando suscripción ${subscriptionId}`);

    await this.subscriptionRepository.update(subscriptionId, {
      status: SubscriptionStatus.CANCELLED,
      paymentStatus: 'cancelled',
      endDate: new Date(),
    });

    this.logger.log(`❌ Suscripción ${subscriptionId} cancelada`);
  }

  private async pauseSubscription(subscriptionId: number): Promise<void> {
    this.logger.log(`⏸️ Pausando suscripción ${subscriptionId}`);

    await this.subscriptionRepository.update(subscriptionId, {
      status: SubscriptionStatus.PENDING_PAYMENT,
      paymentStatus: 'paused',
    });

    this.logger.log(`⏸️ Suscripción ${subscriptionId} pausada`);
  }
}
