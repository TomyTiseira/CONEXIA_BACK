import { Injectable } from '@nestjs/common';
import {
  ContractServiceDto,
  ContractServiceResponseDto,
  CreateQuotationDto,
  CreateQuotationWithDeliverablesDto,
  CreateServiceHiringDto,
  GetServiceHiringsDto,
  PaymentModalityResponseDto,
} from '../dto';
import { MercadoPagoService } from './mercado-pago.service';
import { PaymentModalityService } from './payment-modality.service';
import { AcceptServiceHiringUseCase } from './use-cases/accept-service-hiring.use-case';
import { CancelServiceHiringUseCase } from './use-cases/cancel-service-hiring.use-case';
import { ContractServiceUseCase } from './use-cases/contract-service.use-case';
import { CreateQuotationWithDeliverablesUseCase } from './use-cases/create-quotation-with-deliverables.use-case';
import { CreateQuotationUseCase } from './use-cases/create-quotation.use-case';
import { CreateServiceHiringUseCase } from './use-cases/create-service-hiring.use-case';
import { EditQuotationWithDeliverablesUseCase } from './use-cases/edit-quotation-with-deliverables.use-case';
import { EditQuotationUseCase } from './use-cases/edit-quotation.use-case';
import { GetServiceHiringsByServiceOwnerUseCase } from './use-cases/get-service-hirings-by-service-owner.use-case';
import { GetServiceHiringsByUserUseCase } from './use-cases/get-service-hirings-by-user.use-case';
import { GetServiceHiringsUseCase } from './use-cases/get-service-hirings.use-case';
import { NegotiateServiceHiringUseCase } from './use-cases/negotiate-service-hiring.use-case';
import { ProcessPaymentWebhookUseCase } from './use-cases/process-payment-webhook.use-case';
import { RejectServiceHiringUseCase } from './use-cases/reject-service-hiring.use-case';

@Injectable()
export class ServiceHiringsService {
  constructor(
    private readonly createServiceHiringUseCase: CreateServiceHiringUseCase,
    private readonly createQuotationUseCase: CreateQuotationUseCase,
    private readonly createQuotationWithDeliverablesUseCase: CreateQuotationWithDeliverablesUseCase,
    private readonly editQuotationUseCase: EditQuotationUseCase,
    private readonly editQuotationWithDeliverablesUseCase: EditQuotationWithDeliverablesUseCase,
    private readonly getServiceHiringsUseCase: GetServiceHiringsUseCase,
    private readonly getServiceHiringsByUserUseCase: GetServiceHiringsByUserUseCase,
    private readonly getServiceHiringsByServiceOwnerUseCase: GetServiceHiringsByServiceOwnerUseCase,
    private readonly acceptServiceHiringUseCase: AcceptServiceHiringUseCase,
    private readonly rejectServiceHiringUseCase: RejectServiceHiringUseCase,
    private readonly cancelServiceHiringUseCase: CancelServiceHiringUseCase,
    private readonly negotiateServiceHiringUseCase: NegotiateServiceHiringUseCase,
    private readonly contractServiceUseCase: ContractServiceUseCase,
    private readonly processPaymentWebhookUseCase: ProcessPaymentWebhookUseCase,
    private readonly paymentModalityService: PaymentModalityService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async createServiceHiring(userId: number, createDto: CreateServiceHiringDto) {
    return this.createServiceHiringUseCase.execute(userId, createDto);
  }

  async createQuotation(
    serviceOwnerId: number,
    hiringId: number,
    quotationDto: CreateQuotationDto,
  ) {
    return this.createQuotationUseCase.execute(
      serviceOwnerId,
      hiringId,
      quotationDto,
    );
  }

  async editQuotation(
    serviceOwnerId: number,
    hiringId: number,
    quotationDto: CreateQuotationDto,
  ) {
    return this.editQuotationUseCase.execute(
      serviceOwnerId,
      hiringId,
      quotationDto,
    );
  }

  async createQuotationWithDeliverables(
    serviceOwnerId: number,
    hiringId: number,
    quotationDto: CreateQuotationWithDeliverablesDto,
  ) {
    return this.createQuotationWithDeliverablesUseCase.execute(
      serviceOwnerId,
      hiringId,
      quotationDto,
    );
  }

  async editQuotationWithDeliverables(
    serviceOwnerId: number,
    hiringId: number,
    quotationDto: CreateQuotationWithDeliverablesDto,
  ) {
    return this.editQuotationWithDeliverablesUseCase.execute(
      serviceOwnerId,
      hiringId,
      quotationDto,
    );
  }

  async getPaymentModalities(): Promise<PaymentModalityResponseDto[]> {
    return this.paymentModalityService.getAllPaymentModalities();
  }

  async getServiceHirings(params: GetServiceHiringsDto) {
    return this.getServiceHiringsUseCase.execute(params);
  }

  async getServiceHiringsByUser(userId: number, params: GetServiceHiringsDto) {
    return this.getServiceHiringsByUserUseCase.execute(userId, params);
  }

  async getServiceHiringsByServiceOwner(
    serviceOwnerId: number,
    params: GetServiceHiringsDto,
  ) {
    return this.getServiceHiringsByServiceOwnerUseCase.execute(
      serviceOwnerId,
      params,
    );
  }

  async acceptServiceHiring(userId: number, hiringId: number) {
    return this.acceptServiceHiringUseCase.execute(userId, hiringId);
  }

  async rejectServiceHiring(userId: number, hiringId: number) {
    return this.rejectServiceHiringUseCase.execute(userId, hiringId);
  }

  async cancelServiceHiring(userId: number, hiringId: number) {
    return this.cancelServiceHiringUseCase.execute(userId, hiringId);
  }

  async negotiateServiceHiring(userId: number, hiringId: number) {
    return this.negotiateServiceHiringUseCase.execute(userId, hiringId);
  }

  async contractService(
    userId: number,
    hiringId: number,
    contractDto: ContractServiceDto,
  ): Promise<ContractServiceResponseDto> {
    return this.contractServiceUseCase.execute(userId, hiringId, contractDto);
  }

  async processPaymentWebhook(paymentId: string): Promise<void> {
    return this.processPaymentWebhookUseCase.execute(paymentId);
  }

  async processPreferenceWebhook(preferenceId: string): Promise<void> {
    console.log('📋 Processing preference webhook:', { preferenceId });
    console.log(
      'ℹ️ With test vendor credentials, preference webhooks should work correctly',
    );

    try {
      // Con las nuevas credenciales de vendedor de prueba, los webhooks de preferencia
      // deberían funcionar correctamente. Por ahora, solo logueamos la información.
      console.log('✅ Preference webhook received for ID:', preferenceId);

      // TODO: Implementar lógica específica de preferencias si es necesario
      // Por ahora, los webhooks de pago son más importantes

      console.log('✅ Preference webhook processing completed:', {
        preferenceId,
        message:
          'Using test vendor credentials should resolve phantom payment issues',
      });
    } catch (error) {
      console.error('❌ Error processing preference webhook:', {
        preferenceId,
        error: error.message,
      });
      // No lanzar error para evitar reintentos innecesarios
    }
  }

  async updatePaymentStatus(
    userId: number,
    hiringId: number,
    paymentStatusDto: {
      payment_id: string;
      status: string;
      external_reference: string;
      merchant_order_id?: string;
      preference_id?: string;
    },
  ): Promise<any> {
    console.log('💰 Processing payment status update:', {
      userId,
      hiringId,
      paymentStatusDto,
    });

    // Verificar que el payment_id corresponda a un pago real
    const paymentDetails = await this.mercadoPagoService.getPayment(
      paymentStatusDto.payment_id,
    );

    if (!paymentDetails) {
      throw new Error('Payment not found in MercadoPago');
    }

    // Procesar el pago usando el webhook handler existente
    await this.processPaymentWebhookUseCase.execute(
      paymentStatusDto.payment_id,
    );

    return {
      success: true,
      message: 'Payment status updated successfully',
      payment: paymentDetails,
    };
  }
}
