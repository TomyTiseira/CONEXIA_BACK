import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  BillingCycle,
  SubscriptionStatus,
} from '../../entities/membreship.entity';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { MercadoPagoService } from '../mercado-pago.service';

interface MercadoPagoPaymentInfo {
  preapproval_id: string;
  status: string;
  status_detail?: string;
  date_approved?: string;
  next_payment_date?: string;
}

@Injectable()
export class ProcessSubscriptionInvoiceWebhookUseCase {
  private readonly logger = new Logger(
    ProcessSubscriptionInvoiceWebhookUseCase.name,
  );

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(authorizedPaymentId: string): Promise<void> {
    try {
      this.logger.log(
        `Procesando factura de suscripción: ${authorizedPaymentId}`,
      );

      // Obtener información del pago autorizado desde MercadoPago
      const paymentInfo = (await this.mercadoPagoService.getAuthorizedPayment(
        authorizedPaymentId,
      )) as MercadoPagoPaymentInfo;

      if (!paymentInfo || !paymentInfo.preapproval_id) {
        this.logger.warn(
          `Pago ${authorizedPaymentId} no tiene preapproval_id asociado`,
        );
        return;
      }

      // Buscar la suscripción por el mercadoPagoSubscriptionId
      const subscription =
        await this.subscriptionRepository.findByMercadoPagoSubscriptionId(
          paymentInfo.preapproval_id,
        );

      if (!subscription) {
        throw new NotFoundException(
          `Suscripción con mercadoPagoSubscriptionId ${paymentInfo.preapproval_id} no encontrada`,
        );
      }

      this.logger.log(
        `Suscripción ${subscription.id} encontrada, procesando pago ${paymentInfo.status}`,
      );

      // Procesar según el estado del pago
      if (
        paymentInfo.status === 'approved' ||
        paymentInfo.status === 'authorized'
      ) {
        // Pago exitoso - extender la suscripción
        await this.handleSuccessfulPayment(
          subscription.id,
          paymentInfo,
          authorizedPaymentId,
        );
      } else if (
        paymentInfo.status === 'rejected' ||
        paymentInfo.status === 'cancelled'
      ) {
        // Pago fallido
        await this.handleFailedPayment(subscription.id, paymentInfo);
      } else if (
        paymentInfo.status === 'pending' ||
        paymentInfo.status === 'in_process'
      ) {
        // Pago pendiente
        await this.handlePendingPayment(subscription.id, paymentInfo);
      }

      this.logger.log(`Factura ${authorizedPaymentId} procesada exitosamente`);
    } catch (error) {
      this.logger.error(
        `Error al procesar factura ${authorizedPaymentId}`,
        error.stack,
      );
      throw error;
    }
  }

  private async handleSuccessfulPayment(
    subscriptionId: number,
    paymentInfo: MercadoPagoPaymentInfo,
    authorizedPaymentId: string,
  ): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) return;

    const now = new Date();
    const currentEndDate = subscription.endDate || now;

    // Calcular nueva fecha de fin (extender desde la fecha actual de fin)
    const newEndDate = new Date(currentEndDate);
    if (subscription.billingCycle === BillingCycle.MONTHLY) {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    // Actualizar suscripción
    await this.subscriptionRepository.update(subscriptionId, {
      status: SubscriptionStatus.ACTIVE,
      paymentId: authorizedPaymentId,
      paymentStatus: String(paymentInfo.status || ''),
      paymentStatusDetail: String(paymentInfo.status_detail || ''),
      paidAt: paymentInfo.date_approved
        ? new Date(paymentInfo.date_approved)
        : now,
      startDate: subscription.startDate || now,
      endDate: newEndDate,
      nextPaymentDate: paymentInfo.next_payment_date
        ? new Date(paymentInfo.next_payment_date)
        : null,
      retryCount: 0,
    });

    this.logger.log(
      `Suscripción ${subscriptionId} renovada exitosamente hasta ${newEndDate.toISOString()}`,
    );
  }

  private async handleFailedPayment(
    subscriptionId: number,
    paymentInfo: MercadoPagoPaymentInfo,
  ): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) return;

    const newRetryCount = subscription.retryCount + 1;
    const maxRetries = 3;

    // Si superó el máximo de reintentos, cancelar la suscripción
    const newStatus =
      newRetryCount >= maxRetries
        ? SubscriptionStatus.PAYMENT_FAILED
        : subscription.status;

    await this.subscriptionRepository.update(subscriptionId, {
      status: newStatus,
      paymentStatus: String(paymentInfo.status || ''),
      paymentStatusDetail: String(paymentInfo.status_detail || ''),
      retryCount: newRetryCount,
    });

    this.logger.warn(
      `Pago fallido para suscripción ${subscriptionId}. Reintentos: ${newRetryCount}/${maxRetries}`,
    );

    if (newRetryCount >= maxRetries) {
      this.logger.error(
        `Suscripción ${subscriptionId} marcada como PAYMENT_FAILED después de ${maxRetries} reintentos`,
      );
    }
  }

  private async handlePendingPayment(
    subscriptionId: number,
    paymentInfo: MercadoPagoPaymentInfo,
  ): Promise<void> {
    await this.subscriptionRepository.update(subscriptionId, {
      paymentStatus: String(paymentInfo.status || ''),
      paymentStatusDetail: String(paymentInfo.status_detail || ''),
    });

    this.logger.log(`Pago pendiente para suscripción ${subscriptionId}`);
  }
}
