import { Injectable, Logger } from '@nestjs/common';
import {
  MercadoPagoConfig,
  Payment,
  PreApproval,
  PreApprovalPlan,
  Preference,
} from 'mercadopago';
import { envs } from '../../config/envs';
import { BillingCycle } from '../entities/membreship.entity';

export interface MercadoPagoPreference {
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface MercadoPagoPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  external_reference?: string;
  date_approved?: string;
  payer?: {
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
  };
  payment_method?: {
    id?: string;
    type?: string;
  };
  card?: {
    last_four_digits?: string;
    first_six_digits?: string;
  };
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;
  private preference: Preference;
  private payment: Payment;
  private preApprovalPlan: PreApprovalPlan;
  private preApproval: PreApproval;

  constructor() {
    const accessToken = envs.mercadoPagoAccessToken;

    if (!accessToken) {
      this.logger.error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
    }

    this.client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      },
    });

    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
    this.preApprovalPlan = new PreApprovalPlan(this.client);
    this.preApproval = new PreApproval(this.client);
  }

  async createPreference(
    planName: string,
    planDescription: string,
    price: number,
    billingCycle: BillingCycle,
    subscriptionId: number,
    userEmail: string,
  ): Promise<{ preferenceId: string; initPoint: string }> {
    try {
      const backUrl = envs.mercadoPagoBackUrl;
      const notificationUrl = envs.mercadoPagoNotificationUrl;

      const cycleText =
        billingCycle === BillingCycle.MONTHLY ? 'Mensual' : 'Anual';

      const preferenceData = {
        items: [
          {
            id: `subscription-${subscriptionId}`,
            title: `${planName} - Suscripción ${cycleText}`,
            description: planDescription,
            quantity: 1,
            unit_price: price,
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: `${backUrl}/subscriptions/success`,
          failure: `${backUrl}/subscriptions/failure`,
          pending: `${backUrl}/subscriptions/pending`,
        },
        auto_return: 'approved' as const,
        notification_url: notificationUrl,
        external_reference: subscriptionId.toString(),
        payer: {
          email: userEmail,
        },
        metadata: {
          subscription_id: subscriptionId,
          billing_cycle: billingCycle,
        },
      };

      this.logger.log(
        `Creando preferencia de MercadoPago para suscripción ${subscriptionId}`,
      );
      const response = await this.preference.create({ body: preferenceData });

      if (!response.id || !response.init_point) {
        throw new Error(
          'La respuesta de MercadoPago no contiene id o init_point',
        );
      }

      this.logger.log(`Preferencia creada exitosamente: ${response.id}`);

      return {
        preferenceId: response.id,
        initPoint: response.init_point,
      };
    } catch (error) {
      this.logger.error('Error al crear preferencia de MercadoPago', error);
      throw new Error(
        `Error al crear preferencia de MercadoPago: ${error.message}`,
      );
    }
  }

  async getPayment(paymentId: number): Promise<MercadoPagoPaymentResponse> {
    try {
      this.logger.log(`Obteniendo información del pago ${paymentId}`);
      const response = await this.payment.get({ id: paymentId });

      if (!response.id || !response.status || !response.status_detail) {
        throw new Error('Respuesta incompleta de MercadoPago');
      }

      return {
        id: response.id,
        status: response.status,
        status_detail: response.status_detail,
        external_reference: response.external_reference,
        date_approved: response.date_approved,
        payer: response.payer
          ? {
              email: response.payer.email,
              identification: response.payer.identification
                ? {
                    type: response.payer.identification.type,
                    number: response.payer.identification.number,
                  }
                : undefined,
            }
          : undefined,
        payment_method: response.payment_method_id
          ? {
              id: response.payment_method_id,
              type: response.payment_type_id,
            }
          : undefined,
        card: response.card
          ? {
              last_four_digits: response.card.last_four_digits,
              first_six_digits: response.card.first_six_digits,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener información del pago ${paymentId}`,
        error,
      );
      throw new Error(
        `Error al obtener información del pago: ${error.message}`,
      );
    }
  }

  isPaymentApproved(status: string): boolean {
    return status === 'approved';
  }

  isPaymentRejected(status: string): boolean {
    return ['rejected', 'cancelled', 'refunded', 'charged_back'].includes(
      status,
    );
  }

  isPaymentPending(status: string): boolean {
    return ['pending', 'in_process', 'in_mediation', 'authorized'].includes(
      status,
    );
  }

  /**
   * Crea un plan de suscripción en MercadoPago
   */
  async createSubscriptionPlan(
    planName: string,
    planDescription: string,
    price: number,
    billingCycle: BillingCycle,
  ): Promise<{ planId: string; initPoint: string }> {
    try {
      const backUrl = envs.mercadoPagoBackUrl;
      const frequency = billingCycle === BillingCycle.MONTHLY ? 1 : 12;
      const frequencyType = 'months';

      // DEBUG: Log para verificar el valor de backUrl
      this.logger.log(`🔍 DEBUG - backUrl value: "${backUrl}"`);
      this.logger.log(`🔍 DEBUG - backUrl type: ${typeof backUrl}`);
      this.logger.log(`🔍 DEBUG - envs.mercadoPagoBackUrl: "${envs.mercadoPagoBackUrl}"`);

      const planData = {
        reason: `${planName} - ${billingCycle === BillingCycle.MONTHLY ? 'Mensual' : 'Anual'}`,
        auto_recurring: {
          frequency,
          frequency_type: frequencyType,
          transaction_amount: price,
          currency_id: 'ARS',
          billing_day_proportional: false,
        },
        back_url: `${backUrl}/subscriptions/success`,
      };

      this.logger.log(
        `Creando plan de suscripción en MercadoPago: ${planName}`,
      );
      this.logger.log(`🔍 DEBUG - Full planData:`, JSON.stringify(planData, null, 2));
      const response = await this.preApprovalPlan.create({ body: planData });

      if (!response.id || !response.init_point) {
        throw new Error(
          'La respuesta de MercadoPago no contiene id o init_point',
        );
      }

      this.logger.log(
        `Plan de suscripción creado exitosamente: ${response.id}`,
      );

      return {
        planId: response.id,
        initPoint: response.init_point,
      };
    } catch (error) {
      this.logger.error(
        `Error al crear plan de suscripción en MercadoPago: ${error.message}`,
        error,
      );
      throw new Error(`Error al crear plan de suscripción: ${error.message}`);
    }
  }

  /**
   * Crea una suscripción (preapproval) para un usuario
   */
  async createSubscription(
    mercadoPagoPlanId: string,
    userEmail: string,
    subscriptionId: number,
    cardTokenId: string,
  ): Promise<{
    subscriptionId: string;
    initPoint: string;
    status: string;
    nextPaymentDate: string;
  }> {
    try {
      const backUrl = envs.mercadoPagoBackUrl;

      const subscriptionData = {
        preapproval_plan_id: mercadoPagoPlanId,
        reason: `Suscripción #${subscriptionId}`,
        external_reference: subscriptionId.toString(),
        payer_email: userEmail,
        card_token_id: cardTokenId,
        back_url: `${backUrl}/subscriptions/success`,
        status: 'authorized',
      };

      this.logger.log(
        `Creando suscripción en MercadoPago para usuario ${userEmail}`,
      );
      const response = await this.preApproval.create({
        body: subscriptionData,
      });

      if (!response.id || !response.init_point) {
        throw new Error(
          'La respuesta de MercadoPago no contiene id o init_point',
        );
      }

      this.logger.log(`Suscripción creada exitosamente: ${response.id}`);

      return {
        subscriptionId: response.id,
        initPoint: response.init_point,
        status: response.status || 'pending',
        nextPaymentDate: response.next_payment_date || '',
      };
    } catch (error) {
      this.logger.error(
        `Error al crear suscripción en MercadoPago: ${error.message}`,
        error,
      );
      throw new Error(`Error al crear suscripción: ${error.message}`);
    }
  }

  /**
   * Obtiene información de una suscripción
   */
  async getSubscription(preapprovalId: string): Promise<any> {
    try {
      this.logger.log(
        `Obteniendo información de la suscripción ${preapprovalId}`,
      );
      const response = await this.preApproval.get({ id: preapprovalId });
      return response;
    } catch (error) {
      this.logger.error(`Error al obtener suscripción ${preapprovalId}`, error);
      throw new Error(`Error al obtener suscripción: ${error.message}`);
    }
  }

  /**
   * Cancela una suscripción
   */
  async cancelSubscription(preapprovalId: string): Promise<void> {
    try {
      this.logger.log(`Cancelando suscripción ${preapprovalId}`);
      await this.preApproval.update({
        id: preapprovalId,
        body: { status: 'cancelled' },
      });
      this.logger.log(`Suscripción ${preapprovalId} cancelada exitosamente`);
    } catch (error) {
      this.logger.error(
        `Error al cancelar suscripción ${preapprovalId}`,
        error,
      );
      throw new Error(`Error al cancelar suscripción: ${error.message}`);
    }
  }

  /**
   * Obtiene información de un pago autorizado (factura de suscripción)
   */
  async getAuthorizedPayment(authorizedPaymentId: string): Promise<any> {
    try {
      this.logger.log(
        `Obteniendo información del pago autorizado ${authorizedPaymentId}`,
      );
      // MercadoPago SDK v2 no tiene método directo para authorized_payments
      // Se debe usar fetch o axios directamente
      const response = await fetch(
        `https://api.mercadopago.com/authorized_payments/${authorizedPaymentId}`,
        {
          headers: {
            Authorization: `Bearer ${envs.mercadoPagoAccessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(
        `Error al obtener pago autorizado ${authorizedPaymentId}`,
        error,
      );
      throw new Error(`Error al obtener pago autorizado: ${error.message}`);
    }
  }
}
