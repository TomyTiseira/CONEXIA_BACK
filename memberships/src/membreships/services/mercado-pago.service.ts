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
  private readonly currencyToSiteId: Record<string, string> = {
    ARS: 'MLA', // Argentina
    MXN: 'MLM', // México
    BRL: 'MLB', // Brasil
    CLP: 'MLC', // Chile
    COP: 'MCO', // Colombia
    PEN: 'MPE', // Perú
    UYU: 'MLU', // Uruguay
  };

  constructor() {
    const accessToken = envs.mercadoPagoAccessToken;

    // DEBUG: Logs de verificación
    this.logger.log(
      `🔑 Access Token (primeros 30 chars): ${accessToken?.substring(0, 30)}...`,
    );
    this.logger.log(
      `🌍 Currency ID configurado: ${envs.mercadoPagoCurrencyId}`,
    );
    this.logger.log(`🔗 Back URL configurado: ${envs.mercadoPagoBackUrl}`);

    if (!accessToken) {
      this.logger.error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
    }

    // Verificar que el token sea de Argentina (APP_USR o TEST)
    if (
      !accessToken.startsWith('APP_USR-') &&
      !accessToken.startsWith('TEST-')
    ) {
      this.logger.warn(
        `⚠️ El Access Token no tiene el formato esperado. Debería comenzar con APP_USR- o TEST-`,
      );
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

    this.logger.log('✅ MercadoPago Service inicializado correctamente');
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
      this.logger.log(
        `🔍 DEBUG - envs.mercadoPagoBackUrl: "${envs.mercadoPagoBackUrl}"`,
      );

      const notificationUrl = envs.mercadoPagoNotificationUrl;

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
        notification_url: notificationUrl,
      };

      this.logger.log(
        `Creando plan de suscripción en MercadoPago: ${planName}`,
      );
      this.logger.log(
        `🔍 DEBUG - Full planData:`,
        JSON.stringify(planData, null, 2),
      );
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
   * Obtiene el init_point de un plan para suscripción directa
   */
  getPlanInitPoint(planId: string): string {
    this.logger.log(`Construyendo init_point del plan: ${planId}`);

    // El init_point del plan se construye directamente
    // Formato: https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id={planId}
    const initPoint = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${planId}`;

    this.logger.log(`✅ Init point construido: ${initPoint}`);
    return initPoint;
  }

  /**
   * Valida un cardToken consultando la API de MercadoPago
   */
  private async validateCardToken(cardTokenId: string): Promise<void> {
    try {
      const url = `https://api.mercadopago.com/v1/card_tokens/${cardTokenId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${envs.mercadoPagoAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as {
          message?: string;
          error?: string;
        };
        this.logger.error(
          `❌ Error al validar cardToken: ${JSON.stringify(errorData)}`,
        );
        throw new Error(
          `Card token inválido o de país incorrecto: ${errorData.message || errorData.error || 'Unknown error'}`,
        );
      }

      const tokenData = (await response.json()) as {
        site_id?: string;
        id?: string;
        public_key?: string;
        status?: string;
      };

      this.logger.log(
        `🔍 DEBUG - Token Data completo: ${JSON.stringify(tokenData, null, 2)}`,
      );
      this.logger.log(
        `Card token validado. Site ID: ${tokenData.site_id || 'N/A'}`,
      );

      // Verificar que el token tenga site_id
      if (!tokenData.site_id) {
        this.logger.warn(
          `⚠️ El card token NO tiene site_id. Token recibido: ${cardTokenId}`,
        );
        this.logger.warn(`⚠️ Token data: ${JSON.stringify(tokenData)}`);
        this.logger.warn(
          `⚠️ ADVERTENCIA: Estás usando credenciales APP_USR de una cuenta de prueba. Para desarrollo, deberías usar credenciales TEST- desde https://www.mercadopago.com.ar/developers/panel/app`,
        );
        this.logger.warn(
          `⚠️ Continuando sin validación de site_id (solo para desarrollo)...`,
        );
        // No lanzar error en desarrollo, solo advertir
        // throw new Error(`INVALID_CARD_TOKEN: Token sin site_id`);
      } else if (tokenData.site_id !== 'MLA') {
        // Verificar que el site_id sea MLA (Argentina)
        this.logger.error(
          `❌ Card token de país incorrecto. Esperado: MLA (Argentina), Recibido: ${tokenData.site_id}`,
        );
        throw new Error(
          `El token de tarjeta es de ${tokenData.site_id} pero el backend está configurado para Argentina (MLA). El frontend debe usar el Public Key de Argentina, no de ${tokenData.site_id}.`,
        );
      }

      this.logger.log(
        `✅ Card token validado ${tokenData.site_id ? `para ${tokenData.site_id}` : '(sin site_id - modo desarrollo)'}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error al validar card token: ${errorMessage}`, error);
      throw error;
    }
  }

  /**
   * Genera el init_point para que el usuario se suscriba al plan
   */
  createSubscription(
    mercadoPagoPlanId: string,
    userEmail: string,
    subscriptionId: number,
  ): {
    subscriptionId: string;
    initPoint: string;
    status: string;
    nextPaymentDate: string;
  } {
    try {
      const backUrl = envs.mercadoPagoBackUrl;

      this.logger.log(
        `Creando suscripción en MercadoPago para usuario ${userEmail}`,
      );
      this.logger.log(
        `� USANDO REDIRECT FLOW - El usuario ingresará la tarjeta en MercadoPago`,
      );

      // No validar el token ya que usaremos redirect flow
      // await this.validateCardToken(cardTokenId);

      // Construir init_point del plan con parámetros adicionales
      const notificationUrl = envs.mercadoPagoNotificationUrl;
      const initPoint = this.getPlanInitPoint(mercadoPagoPlanId);

      // ✅ Usar URLSearchParams para construir correctamente la query string
      const url = new URL(initPoint);
      url.searchParams.set('external_reference', subscriptionId.toString());
      url.searchParams.set('payer_email', userEmail);

      // Agregar back_url y notification_url
      url.searchParams.set('back_url', `${backUrl}/subscriptions/success`);
      url.searchParams.set('notification_url', notificationUrl);

      const finalInitPoint = url.toString();

      this.logger.log(
        `✅ Init point generado para suscripción #${subscriptionId}`,
      );
      this.logger.log(`🔔 Notification URL incluida: ${notificationUrl}`);
      this.logger.log(`🔗 URL completa: ${finalInitPoint}`);

      return {
        subscriptionId: '', // Se creará después del pago
        initPoint: finalInitPoint,
        status: 'pending',
        nextPaymentDate: '',
      };
    } catch (error) {
      this.logger.error(
        `Error al crear suscripción en MercadoPago: ${error.message}`,
      );
      this.logger.error('Error completo:', JSON.stringify(error, null, 2));
      if (error.cause) {
        this.logger.error(
          'Causa del error:',
          JSON.stringify(error.cause, null, 2),
        );
      }
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
