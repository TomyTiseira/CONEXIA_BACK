import { Injectable, Logger } from '@nestjs/common';
import {
  Subscription,
  SubscriptionStatus,
} from '../../entities/membreship.entity';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { MercadoPagoService } from '../mercado-pago.service';

@Injectable()
export class ProcessPreapprovalWebhookUseCase {
  private readonly logger = new Logger(ProcessPreapprovalWebhookUseCase.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(
    preapprovalId: string,
    action: string,
    subscriptionIdFromFrontend?: number,
  ): Promise<{ success: boolean; message: string; subscriptionId: number }> {
    try {
      this.logger.log(
        `🎉 Procesando webhook de preapproval ${preapprovalId}, acción: ${action}`,
      );

      // Obtener información del preapproval desde MercadoPago
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const preapprovalData: any =
        await this.mercadoPagoService.getSubscription(preapprovalId);

      this.logger.log(
        `📋 Preapproval data: ${JSON.stringify(preapprovalData)}`,
      );

      let subscription: Subscription | null = null;

      // Intentar usar el subscriptionId que viene del frontend
      if (subscriptionIdFromFrontend) {
        this.logger.log(
          `Buscando suscripción por ID del frontend: ${subscriptionIdFromFrontend}`,
        );
        subscription = await this.subscriptionRepository.findById(
          subscriptionIdFromFrontend,
        );
      }

      // Si no viene del frontend, intentar obtener desde external_reference
      if (!subscription && preapprovalData.external_reference) {
        const subId = parseInt(preapprovalData.external_reference, 10);
        subscription = await this.subscriptionRepository.findById(subId);
      }

      if (!subscription) {
        this.logger.warn(
          `No se encontró suscripción para preapproval ${preapprovalId}`,
        );
        return {
          success: false,
          message: 'Suscripción no encontrada',
          subscriptionId: 0,
        };
      }

      this.logger.log(
        `📝 Suscripción encontrada: ID ${subscription.id}, estado actual: ${subscription.status}`,
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
        `✅ Webhook de preapproval procesado exitosamente para suscripción ${subscription.id}`,
      );

      return {
        success: true,
        message: 'Suscripción activada correctamente',
        subscriptionId: subscription.id,
      };
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
      `✅ Suscripción ${subscriptionId} activada exitosamente. Próximo pago: ${nextPaymentDate ? nextPaymentDate.toISOString() : 'N/A'}`,
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
