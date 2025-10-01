import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PaymentStatus } from '../../entities/payment.entity';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { PaymentRepository } from '../../repositories/payment.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { MercadoPagoService } from '../mercado-pago.service';
import { ServiceHiringStatusService } from '../service-hiring-status.service';

@Injectable()
export class ProcessPaymentWebhookUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly statusService: ServiceHiringStatusService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(paymentId: string): Promise<void> {
    try {
      console.log(`Processing webhook for payment ID: ${paymentId}`);

      // Obtener información del pago desde MercadoPago
      const mpPayment = await this.mercadoPagoService.getPayment(paymentId);

      console.log(`MercadoPago payment status: ${mpPayment.status}`);

      // Buscar el pago en nuestra base de datos
      const payment =
        await this.paymentRepository.findByMercadoPagoPaymentId(paymentId);

      if (!payment) {
        console.error(
          `Payment not found in database for MP payment ID: ${paymentId}`,
        );
        return;
      }

      // Si el pago ya fue procesado, no hacer nada
      if (payment.status !== PaymentStatus.PENDING) {
        console.log(
          `Payment ${payment.id} already processed with status: ${payment.status}`,
        );
        return;
      }

      // Procesar según el estado del pago
      if (this.mercadoPagoService.isPaymentApproved(mpPayment)) {
        await this.approvePayment(payment, mpPayment);
      } else if (this.mercadoPagoService.isPaymentRejected(mpPayment)) {
        await this.rejectPayment(payment, mpPayment);
      } else if (this.mercadoPagoService.isPaymentPending(mpPayment)) {
        await this.updatePaymentAsPending(payment, mpPayment);
      }

      console.log(`Webhook processed successfully for payment ${payment.id}`);
    } catch (error) {
      console.error('Error processing payment webhook:', error);
      throw new RpcException(
        `Error processing payment webhook: ${error.message}`,
      );
    }
  }

  private async approvePayment(payment, mpPayment): Promise<void> {
    // Actualizar estado del pago
    await this.paymentRepository.update(payment.id, {
      status: PaymentStatus.APPROVED,
      mercadoPagoPaymentId: mpPayment.id.toString(),
      mercadoPagoResponse: mpPayment,
      processedAt: new Date(),
    });

    // Obtener el estado "approved"
    const approvedStatus = await this.statusService.getStatusByCode(
      ServiceHiringStatusCode.APPROVED,
    );

    // Actualizar estado de la contratación
    await this.hiringRepository.update(payment.hiringId, {
      statusId: approvedStatus.id,
      respondedAt: new Date(),
    });

    console.log(
      `Payment ${payment.id} approved and hiring ${payment.hiringId} updated to approved status`,
    );
  }

  private async rejectPayment(payment, mpPayment): Promise<void> {
    await this.paymentRepository.update(payment.id, {
      status: PaymentStatus.REJECTED,
      mercadoPagoPaymentId: mpPayment.id.toString(),
      mercadoPagoResponse: mpPayment,
      failureReason: mpPayment.status_detail,
      processedAt: new Date(),
    });

    console.log(
      `Payment ${payment.id} rejected with reason: ${mpPayment.status_detail}`,
    );
  }

  private async updatePaymentAsPending(payment, mpPayment): Promise<void> {
    await this.paymentRepository.update(payment.id, {
      mercadoPagoPaymentId: mpPayment.id.toString(),
      mercadoPagoResponse: mpPayment,
    });

    console.log(`Payment ${payment.id} still pending`);
  }
}
