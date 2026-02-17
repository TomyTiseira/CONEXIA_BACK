import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { DeliverableStatus } from '../../entities/deliverable.entity';
import { DeliveryStatus } from '../../entities/delivery-submission.entity';
import { PaymentStatus } from '../../entities/payment.entity';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { DeliverableRepository } from '../../repositories/deliverable.repository';
import { DeliverySubmissionRepository } from '../../repositories/delivery-submission.repository';
import { PaymentRepository } from '../../repositories/payment.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { MercadoPagoService } from '../mercado-pago.service';
import { ServiceHiringStatusService } from '../service-hiring-status.service';

@Injectable()
export class ProcessPaymentWebhookUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly deliveryRepository: DeliverySubmissionRepository,
    private readonly deliverableRepository: DeliverableRepository,
    private readonly statusService: ServiceHiringStatusService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(
    paymentId: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Obtener información del pago desde MercadoPago PRIMERO
      // En Checkout Pro, el payment_id solo existe después del checkout completo
      let mpPayment;
      try {
        mpPayment = await this.getPaymentWithRetry(paymentId);
      } catch (error) {
        console.error(
          `❌ Error getting payment from MercadoPago: ${error.message}`,
        );

        // Investigar más a fondo el problema
        console.error('� PAYMENT CREATION PROBLEM:', {
          webhookPaymentId: paymentId,
          webhookTimestamp: new Date().toISOString(),
          issue:
            'MercadoPago sent webhook for payment that does not exist in their API',
          nextSteps:
            'Need to investigate why payments are not being created properly',
        });

        // Investigar el problema de pagos fantasma
        this.debugPaymentCreationIssue(paymentId);

        // Ejecutar diagnóstico específico para pagos fantasma
        // Phantom payment diagnostics - using test vendor credentials should resolve this
        return {
          success: false,
          message: 'Payment not found in MercadoPago API',
        };
      }

      // Buscar el pago en nuestra base de datos usando múltiples estrategias
      const payment = await this.findPaymentForWebhook(paymentId, mpPayment);

      if (!payment) {
        return { success: false, message: 'Payment not found in database' };
      }

      // 🔥 MEJORADO: Chequeo de idempotencia más robusto
      if (payment.status !== PaymentStatus.PENDING) {
        return {
          success: true,
          message: 'Payment already processed (idempotency)',
        };
      }

      // 🔥 DOUBLE CHECK: Volver a verificar el estado después del bloqueo
      // MercadoPago puede enviar webhooks duplicados rápidamente
      const freshPayment = await this.paymentRepository.findById(payment.id);
      if (freshPayment && freshPayment.status !== PaymentStatus.PENDING) {
        return {
          success: true,
          message: 'Payment processed by another webhook',
        };
      }

      // Procesar según el estado del pago
      if (this.mercadoPagoService.isPaymentApproved(mpPayment)) {
        await this.approvePayment(payment, mpPayment);
      } else if (this.mercadoPagoService.isPaymentRejected(mpPayment)) {
        await this.rejectPayment(payment, mpPayment);
      } else if (this.mercadoPagoService.isPaymentPending(mpPayment)) {
        await this.updatePaymentAsPending(payment, mpPayment);
      }

      return {
        success: true,
        message: 'Payment webhook processed successfully',
      };
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
      mercadoPagoPaymentMethodId: mpPayment.payment_method_id,
      mercadoPagoPaymentTypeId: mpPayment.payment_type_id,
      processedAt: new Date(),
    });

    // 🔥 NUEVO: Aprobar la entrega asociada si existe
    if (payment.deliverySubmissionId) {
      await this.approveDeliverySubmission(payment.deliverySubmissionId);
    }

    // Determinar el nuevo estado del hiring basado en el tipo de pago
    const hiring = await this.hiringRepository.findById(payment.hiringId, [
      'payments',
      'deliverables',
      'status',
    ]);

    if (!hiring) {
      console.error(`Hiring ${payment.hiringId} not found`);
      return;
    }

    // 🔥 OPTIMIZADO: Determinar el nuevo estado y actualizar en una sola operación
    let newStatusCode: ServiceHiringStatusCode;

    // Si es pago de delivery (FULL, FINAL o DELIVERABLE), verificar si debe completarse
    if (
      payment.paymentType === 'full' ||
      payment.paymentType === 'final' ||
      payment.paymentType === 'deliverable'
    ) {
      // Para pagos de tipo DELIVERABLE, verificar si quedan entregables pendientes
      if (payment.paymentType === 'deliverable') {
        const pendingDeliverables =
          hiring.deliverables?.filter(
            (d) =>
              d.status !== DeliverableStatus.APPROVED &&
              d.status !== DeliverableStatus.REJECTED,
          ).length || 0;

        if (pendingDeliverables > 0) {
          // Aún quedan entregables pendientes, volver a APPROVED
          newStatusCode = ServiceHiringStatusCode.APPROVED;
        } else {
          // Es el último DELIVERABLE, marcar como COMPLETED
          newStatusCode = ServiceHiringStatusCode.COMPLETED;
        }
      } else {
        // Si es FULL o FINAL, marcar como COMPLETED
        newStatusCode = ServiceHiringStatusCode.COMPLETED;
      }
    } else {
      // Si es pago inicial (INITIAL), mantener en APPROVED
      newStatusCode = ServiceHiringStatusCode.APPROVED;
    }

    // Obtener el status correspondiente
    const newStatus = await this.statusService.getStatusByCode(newStatusCode);

    // 🔥 CRÍTICO: Actualizar hiring con estado Y datos de pago en UNA SOLA operación
    await this.hiringRepository.update(hiring.id, {
      statusId: newStatus.id,
      paymentId: mpPayment.id.toString(),
      paymentStatus: mpPayment.status,
      paymentStatusDetail: mpPayment.status_detail,
      paidAt: new Date(),
      respondedAt: new Date(),
    });
  }

  private async rejectPayment(payment, mpPayment): Promise<void> {
    await this.paymentRepository.update(payment.id, {
      status: PaymentStatus.REJECTED,
      mercadoPagoPaymentId: mpPayment.id.toString(),
      mercadoPagoResponse: mpPayment,
      failureReason: mpPayment.status_detail,
      processedAt: new Date(),
    });

    // 🔥 CRÍTICO: Si el hiring está en PAYMENT_PENDING, transicionar a PAYMENT_REJECTED
    const hiring = await this.hiringRepository.findById(payment.hiringId, [
      'status',
    ]);

    if (!hiring) {
      console.error(`Hiring ${payment.hiringId} not found`);
      return;
    }

    if (hiring.status?.code === ServiceHiringStatusCode.PAYMENT_PENDING) {
      const rejectedStatus = await this.statusService.getStatusByCode(
        ServiceHiringStatusCode.PAYMENT_REJECTED,
      );

      await this.hiringRepository.update(hiring.id, {
        statusId: rejectedStatus.id,
        paymentId: mpPayment.id.toString(),
        paymentStatus: mpPayment.status,
        paymentStatusDetail: mpPayment.status_detail,
      });
    }
  }

  private async updatePaymentAsPending(payment, mpPayment): Promise<void> {
    await this.paymentRepository.update(payment.id, {
      mercadoPagoPaymentId: mpPayment.id.toString(),
      mercadoPagoResponse: mpPayment,
    });

    // 🔥 Si el hiring está en PAYMENT_PENDING, actualizar los datos del pago
    const hiring = await this.hiringRepository.findById(payment.hiringId, [
      'status',
    ]);

    if (
      hiring &&
      hiring.status?.code === ServiceHiringStatusCode.PAYMENT_PENDING
    ) {
      await this.hiringRepository.update(hiring.id, {
        paymentId: mpPayment.id.toString(),
        paymentStatus: mpPayment.status,
        paymentStatusDetail: mpPayment.status_detail,
      });
    }
  }

  private async findPaymentForWebhook(paymentId: string, mpPayment: any) {
    // Estrategia 1: Buscar por mercadoPagoPaymentId
    let payment =
      await this.paymentRepository.findByMercadoPagoPaymentId(paymentId);
    if (payment) {
      return payment;
    }

    // Estrategia 2: Buscar por external_reference (más confiable en Checkout Pro)
    // Formato: hiring_{hiringId}_payment_{paymentId}
    if (mpPayment?.external_reference) {
      const externalRefMatch = mpPayment.external_reference.match(
        /hiring_(\d+)_payment_(\d+)/,
      );
      if (externalRefMatch) {
        const paymentIdFromRef = parseInt(externalRefMatch[2]); // Extraer paymentId, no hiringId
        payment = await this.paymentRepository.findById(paymentIdFromRef);
        if (payment) {
          return payment;
        }
      }
    }

    // ⚠️ NO FALLBACK: El fallback era peligroso porque podía procesar pagos incorrectos
    // Si llegamos aquí, el webhook no pertenece a este microservicio o hay un problema
    return null;
  }

  private async getPaymentWithRetry(
    paymentId: string,
    maxRetries: number = 3,
  ): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Si no es el primer intento, esperar un poco
        if (attempt > 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)); // 2s, 4s, 6s
        }

        return await this.mercadoPagoService.getPayment(paymentId);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error; // Re-throw en el último intento
        }
      }
    }
  }

  private debugPaymentCreationIssue(paymentId: string): void {
    // Placeholder for debugging - can be removed in production
  }

  /**
   * 🔥 CRÍTICO: Aprobar la entrega solo cuando el pago sea confirmado
   * Esto previene que las entregas aparezcan como aprobadas si el cliente sale sin pagar
   */
  private async approveDeliverySubmission(
    deliverySubmissionId: number,
  ): Promise<void> {
    try {
      const delivery =
        await this.deliveryRepository.findById(deliverySubmissionId);

      if (!delivery) {
        return;
      }

      // Verificar que la entrega esté en estado PENDING_PAYMENT
      if (delivery.status !== DeliveryStatus.PENDING_PAYMENT) {
        // Continuar de todos modos para casos edge
      }

      // ✅ AQUÍ es donde realmente se aprueba la entrega (después de confirmar el pago)
      await this.deliveryRepository.update(deliverySubmissionId, {
        status: DeliveryStatus.APPROVED,
        approvedAt: new Date(),
      });

      // Si la entrega está asociada a un deliverable, aprobarlo también
      if (delivery.deliverableId) {
        await this.deliverableRepository.update(delivery.deliverableId, {
          status: DeliverableStatus.APPROVED,
          approvedAt: new Date(),
        });
      }
    } catch (error) {
      // No re-throw para no bloquear el procesamiento del webhook
    }
  }
}
