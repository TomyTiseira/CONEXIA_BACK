import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export interface MercadoPagoPreferenceItem {
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface MercadoPagoPreference {
  items: MercadoPagoPreferenceItem[];
  back_urls: {
    success: string;
    pending: string;
    failure: string;
  };
  notification_url: string;
  external_reference: string;
  auto_return?: 'approved' | 'all';
  binary_mode?: boolean;
  payment_methods?: {
    excluded_payment_methods?: string[];
    excluded_payment_types?: string[];
    installments?: number;
    default_installments?: number;
  };
  payer?: {
    name?: string;
    surname?: string;
    email?: string;
  };
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface MercadoPagoPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  external_reference: string;
  payment_method_id: string;
  payment_type_id: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  private readonly baseUrl = 'https://api.mercadopago.com';

  // NUEVA CONFIGURACIÓN: Usar ambiente productivo con credenciales vendedor de prueba
  // Esto resuelve el problema de "phantom payments" que ocurre en sandbox
  private readonly isTestVendorCredentials =
    this.accessToken?.includes('2726149732'); // Collector ID vendedor prueba
  private readonly isProduction =
    process.env.NODE_ENV === 'production' || this.isTestVendorCredentials;
  private readonly isSandbox = !this.isProduction;

  constructor() {
    if (!this.accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN is required');
    }
  }

  async createPreference(
    preference: MercadoPagoPreference,
  ): Promise<MercadoPagoPreferenceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preference),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`MercadoPago API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating MercadoPago preference:', error);
      throw new RpcException(
        `Error creating payment preference: ${error.message}`,
      );
    }
  }

  async getPayment(paymentId: string): Promise<MercadoPagoPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`MercadoPago API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting MercadoPago payment:', error);
      throw new RpcException(
        `Error getting payment information: ${error.message}`,
      );
    }
  }

  getInitPoint(preferenceResponse: MercadoPagoPreferenceResponse): string {
    // NUEVA CONFIGURACIÓN: Con credenciales vendedor de prueba, usar init_point productivo
    // Esto evita los "phantom payments" del sandbox
    const useProductionUrl = this.isProduction || this.isTestVendorCredentials;
    const url = useProductionUrl
      ? preferenceResponse.init_point
      : preferenceResponse.sandbox_init_point;

    return url;
  }

  isPaymentApproved(payment: MercadoPagoPaymentResponse): boolean {
    return payment.status === 'approved';
  }

  isPaymentRejected(payment: MercadoPagoPaymentResponse): boolean {
    return payment.status === 'rejected' || payment.status === 'cancelled';
  }

  isPaymentPending(payment: MercadoPagoPaymentResponse): boolean {
    return payment.status === 'pending' || payment.status === 'in_process';
  }
}
