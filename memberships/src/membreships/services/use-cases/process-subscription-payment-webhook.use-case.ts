import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  BillingCycle,
  SubscriptionStatus,
} from '../../entities/membreship.entity';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import {
  MercadoPagoPaymentResponse,
  MercadoPagoService,
} from '../mercado-pago.service';

@Injectable()
export class ProcessSubscriptionPaymentWebhookUseCase {
  private readonly logger = new Logger(
    ProcessSubscriptionPaymentWebhookUseCase.name,
  );

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(
    paymentId: number,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      this.logger.log(`Procesando webhook de pago ${paymentId}`);

      // Obtener información del pago desde MercadoPago
      const paymentData = await this.mercadoPagoService.getPayment(paymentId);

      if (!paymentData.external_reference) {
        this.logger.warn(`Pago ${paymentId} no tiene external_reference`);
        return { success: false, message: 'No external_reference' };
      }

      // Verificar si el external_reference es del formato de services (hiring_X_payment_Y)
      // En ese caso, ignorar ya que no es una suscripción
      if (paymentData.external_reference.startsWith('hiring_')) {
        this.logger.log(
          `Pago ${paymentId} es de un servicio (${paymentData.external_reference}), ignorando en memberships`,
        );
        return {
          success: true,
          message: 'Payment belongs to services microservice',
        };
      }

      // Verificar que el external_reference sea COMPLETAMENTE numérico (no UUID)
      // UUIDs pueden empezar con dígitos: 0474bfc7-... → parseInt da 474 ❌
      if (!/^\d+$/.test(paymentData.external_reference)) {
        // Es un UUID de MercadoPago, esperar el webhook de preapproval
        this.logger.log(
          `external_reference es UUID (${paymentData.external_reference}). Esperando webhook de preapproval para activar la suscripción.`,
        );
        return {
          success: true,
          message: 'Waiting for preapproval webhook (UUID)',
        };
      }

      // Ahora sí, parsear el ID numérico
      const subscriptionId = parseInt(paymentData.external_reference, 10);

      // Obtener la suscripción
      const subscription =
        await this.subscriptionRepository.findById(subscriptionId);

      if (!subscription) {
        throw new NotFoundException(
          `Suscripción ${subscriptionId} no encontrada`,
        );
      }

      this.logger.log(
        `Procesando pago para suscripción ${subscriptionId}, estado: ${paymentData.status}`,
      );

      // Si el pago fue aprobado
      if (this.mercadoPagoService.isPaymentApproved(paymentData.status)) {
        await this.handleApprovedPayment(subscription.id, paymentData);
      }
      // Si el pago fue rechazado
      else if (this.mercadoPagoService.isPaymentRejected(paymentData.status)) {
        await this.handleRejectedPayment(subscription.id, paymentData);
      }
      // Si el pago está pendiente
      else if (this.mercadoPagoService.isPaymentPending(paymentData.status)) {
        await this.handlePendingPayment(subscription.id, paymentData);
      }

      this.logger.log(
        `Webhook procesado exitosamente para suscripción ${subscriptionId}`,
      );
      return {
        success: true,
        message: 'Subscription payment webhook processed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error al procesar webhook de pago ${paymentId}:`,
        error.stack,
      );
      throw error;
    }
  }

  private async handleApprovedPayment(
    subscriptionId: number,
    paymentData: MercadoPagoPaymentResponse,
  ): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Suscripción ${subscriptionId} no encontrada`,
      );
    }

    // Si ya está activa, no hacer nada
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      this.logger.log(`Suscripción ${subscriptionId} ya está activa`);
      return;
    }

    const now = new Date();
    const startDate = now;
    const endDate = new Date(startDate);

    // Calcular fecha de finalización según el ciclo de facturación
    if (subscription.billingCycle === BillingCycle.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Actualizar suscripción a activa
    await this.subscriptionRepository.update(subscriptionId, {
      status: SubscriptionStatus.ACTIVE,
      paymentId: paymentData.id.toString(),
      paymentStatus: paymentData.status,
      paymentStatusDetail: paymentData.status_detail,
      paidAt: paymentData.date_approved
        ? new Date(paymentData.date_approved)
        : now,
      startDate,
      endDate,
      // Guardar información del método de pago
      paymentMethodType: paymentData.payment_method?.type || null,
      cardLastFourDigits: paymentData.card?.last_four_digits || null,
      cardBrand: paymentData.payment_method?.id || null,
    });

    this.logger.log(
      `Suscripción ${subscriptionId} activada. Válida desde ${startDate.toISOString()} hasta ${endDate.toISOString()}`,
    );

    // Si esta suscripción reemplaza a otra, marcar la anterior como reemplazada
    if (subscription.replacesSubscriptionId) {
      await this.subscriptionRepository.update(
        subscription.replacesSubscriptionId,
        {
          status: SubscriptionStatus.REPLACED,
          endDate: now, // Finalizar inmediatamente
        },
      );

      this.logger.log(
        `Suscripción ${subscription.replacesSubscriptionId} marcada como REPLACED`,
      );
    }
  }

  private async handleRejectedPayment(
    subscriptionId: number,
    paymentData: MercadoPagoPaymentResponse,
  ): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Suscripción ${subscriptionId} no encontrada`,
      );
    }

    // Incrementar contador de reintentos
    const retryCount = (subscription.retryCount || 0) + 1;

    await this.subscriptionRepository.update(subscriptionId, {
      status: SubscriptionStatus.PAYMENT_FAILED,
      paymentId: paymentData.id.toString(),
      paymentStatus: paymentData.status,
      paymentStatusDetail: paymentData.status_detail,
      retryCount,
    });

    this.logger.log(
      `Suscripción ${subscriptionId} marcada como PAYMENT_FAILED. Intento ${retryCount}`,
    );
  }

  private async handlePendingPayment(
    subscriptionId: number,
    paymentData: MercadoPagoPaymentResponse,
  ): Promise<void> {
    await this.subscriptionRepository.update(subscriptionId, {
      paymentId: paymentData.id.toString(),
      paymentStatus: paymentData.status,
      paymentStatusDetail: paymentData.status_detail,
    });

    this.logger.log(`Suscripción ${subscriptionId} sigue en estado pendiente`);
  }
}
