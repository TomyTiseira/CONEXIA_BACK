import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PaymentStatus, PaymentType } from '../../entities/payment.entity';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { PaymentRepository } from '../../repositories/payment.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { MercadoPagoService } from '../mercado-pago.service';
import { ServiceHiringStatusService } from '../service-hiring-status.service';

@Injectable()
export class RetryPaymentUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly statusService: ServiceHiringStatusService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(hiringId: number): Promise<{
    initPoint: string;
    preferenceId: string;
  }> {
    // 1. Verificar que el hiring existe y está en estado PAYMENT_REJECTED
    const hiring = await this.hiringRepository.findById(hiringId, [
      'status',
      'service',
      'service.user',
      'paymentModality',
      'payments',
    ]);

    if (!hiring) {
      throw new RpcException(`Service hiring ${hiringId} not found`);
    }

    if (hiring.status?.code !== ServiceHiringStatusCode.PAYMENT_REJECTED) {
      throw new RpcException(
        `Cannot retry payment: hiring is in status ${hiring.status?.code}, expected payment_rejected`,
      );
    }

    console.log(
      `🔄 Retrying payment for hiring ${hiringId} (attempt ${hiring.retryCount + 1})`,
    );

    // 2. Buscar el pago rechazado anterior
    const previousPayment = hiring.payments?.find(
      (p) => p.paymentType === 'initial' && p.status === 'rejected',
    );

    if (!previousPayment) {
      throw new RpcException(
        `No rejected payment found for hiring ${hiringId}`,
      );
    }

    // 3. Crear nueva preferencia en MercadoPago
    const preference = {
      items: [
        {
          title: `Reintento de pago - ${hiring.service?.title || 'Servicio'}`,
          description: `Reintento #${hiring.retryCount + 1} - ${hiring.service?.description || ''}`,
          quantity: 1,
          unit_price: hiring.quotedPrice,
          currency_id: 'ARS',
        },
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/hirings/${hiring.id}/payment/success`,
        failure: `${process.env.FRONTEND_URL}/hirings/${hiring.id}/payment/failure`,
        pending: `${process.env.FRONTEND_URL}/hirings/${hiring.id}/payment/pending`,
      },
      auto_return: 'approved' as const,
      external_reference: `hiring_${hiring.id}`,
      notification_url: `${process.env.API_BASE_URL}/api/webhooks/mercadopago`,
      binary_mode: true,
      metadata: {
        hiringId: hiring.id,
        retryCount: hiring.retryCount + 1,
        paymentType: PaymentType.INITIAL,
        totalAmount: Number(hiring.quotedPrice),
      },
    };

    const preferenceResponse =
      await this.mercadoPagoService.createPreference(preference);

    console.log(`✅ MercadoPago preference created for retry:`, {
      preferenceId: preferenceResponse.id,
      initPoint: this.mercadoPagoService.getInitPoint(preferenceResponse),
      retryCount: hiring.retryCount + 1,
    });

    // 4. Crear nuevo registro de pago
    const newPayment = await this.paymentRepository.create({
      hiringId: hiring.id,
      amount: hiring.quotedPrice,
      paymentType: PaymentType.INITIAL,
      status: PaymentStatus.PENDING,
      mercadoPagoPreferenceId: preferenceResponse.id,
      createdAt: new Date(),
    });

    console.log(
      `💳 Created new payment record for retry: payment_id=${newPayment.id}`,
    );

    // 5. Actualizar hiring a PAYMENT_PENDING y incrementar retryCount
    const paymentPendingStatus = await this.statusService.getStatusByCode(
      ServiceHiringStatusCode.PAYMENT_PENDING,
    );

    await this.hiringRepository.update(hiring.id, {
      statusId: paymentPendingStatus.id,
      preferenceId: preferenceResponse.id,
      paymentStatus: 'pending',
      paymentStatusDetail: `Reintento ${hiring.retryCount + 1}`,
      retryCount: hiring.retryCount + 1,
    });

    console.log(
      `✅ Hiring ${hiringId} transitioned to PAYMENT_PENDING (retry ${hiring.retryCount + 1})`,
    );

    // 6. Retornar datos para redirección
    return {
      initPoint: this.mercadoPagoService.getInitPoint(preferenceResponse),
      preferenceId: preferenceResponse.id,
    };
  }
}
