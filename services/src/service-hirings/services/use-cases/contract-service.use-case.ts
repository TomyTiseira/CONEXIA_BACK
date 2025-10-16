import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ContractServiceDto, ContractServiceResponseDto } from '../../dto';
import { PaymentStatus, PaymentType } from '../../entities/payment.entity';
import { PaymentModalityCode } from '../../enums/payment-modality.enum';
import { PaymentRepository } from '../../repositories/payment.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { MercadoPagoService } from '../mercado-pago.service';
import { ServiceHiringStatusService } from '../service-hiring-status.service';
import { ServiceHiringValidationService } from '../service-hiring-validation.service';

@Injectable()
export class ContractServiceUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly statusService: ServiceHiringStatusService,
    private readonly validationService: ServiceHiringValidationService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(
    userId: number,
    hiringId: number,
    contractDto: ContractServiceDto,
  ): Promise<ContractServiceResponseDto> {
    // Validar precondiciones
    const { user, hiring } =
      await this.validationService.validateUserCanContractService(
        userId,
        hiringId,
      );

    try {
      // Determinar tipo de pago y monto según modalidad
      let amountToPay = Number(hiring.quotedPrice);
      let paymentType = PaymentType.FULL;
      let itemDescription = hiring.description;

      if (hiring.paymentModality?.code === PaymentModalityCode.FULL_PAYMENT) {
        // Calcular el 25% para el anticipo (pago inicial)
        amountToPay = Math.round(Number(hiring.quotedPrice) * 0.25);
        paymentType = PaymentType.INITIAL;
        itemDescription = `Anticipo (25%) - Total del servicio: $${hiring.quotedPrice}`;

        console.log('💰 Calculating initial payment (25%):', {
          totalPrice: hiring.quotedPrice,
          initialPayment: amountToPay,
          remainingPayment: Number(hiring.quotedPrice) - amountToPay,
        });
      } else if (
        hiring.paymentModality?.code === PaymentModalityCode.BY_DELIVERABLES
      ) {
        throw new RpcException(
          'Para servicios con pago por entregables, debe pagar cada entregable individualmente',
        );
      }

      // Crear registro de pago
      const payment = await this.paymentRepository.create({
        hiringId: hiring.id,
        amount: amountToPay,
        totalAmount: Number(hiring.quotedPrice),
        status: PaymentStatus.PENDING,
        paymentMethod: contractDto.paymentMethod,
        paymentType: paymentType,
      });

      console.log('📝 Payment record created:', {
        paymentId: payment.id,
        amount: payment.amount,
        totalAmount: payment.totalAmount,
        paymentType: payment.paymentType,
      });

      // Crear preferencia de MercadoPago
      const preference = {
        items: [
          {
            title: `Contratación de servicio: ${hiring.service.title}`,
            description: itemDescription,
            quantity: 1,
            unit_price: amountToPay,
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: `${process.env.FRONTEND_URL}/service-hirings/payment/success`,
          pending: `${process.env.FRONTEND_URL}/service-hirings/payment/pending`,
          failure: `${process.env.FRONTEND_URL}/service-hirings/payment/failure`,
        },
        notification_url: `${process.env.API_BASE_URL}/api/webhooks/mercadopago`,
        external_reference: `hiring_${hiring.id}_payment_${payment.id}`,
        binary_mode: true,
        metadata: {
          hiringId: hiring.id,
          paymentId: payment.id,
          paymentType: paymentType,
          totalAmount: Number(hiring.quotedPrice),
          paidAmount: amountToPay,
          modalityCode: hiring.paymentModality?.code || 'none',
        },
      };

      console.log('🔍 MercadoPago Preference Created:', {
        external_reference: preference.external_reference,
        notification_url: preference.notification_url,
        amount: amountToPay,
        paymentType: paymentType,
        totalAmount: hiring.quotedPrice,
        frontendUrl: process.env.FRONTEND_URL,
        apiBaseUrl: process.env.API_BASE_URL,
      });

      const preferenceResponse =
        await this.mercadoPagoService.createPreference(preference);

      // Actualizar payment con información de MercadoPago
      await this.paymentRepository.update(payment.id, {
        mercadoPagoPreferenceId: preferenceResponse.id,
      });

      return {
        success: true,
        message: 'Preferencia de pago creada exitosamente',
        data: {
          paymentId: payment.id,
          mercadoPagoUrl:
            this.mercadoPagoService.getInitPoint(preferenceResponse),
          preferenceId: preferenceResponse.id,
        },
      };
    } catch (error) {
      console.error('Error creating contract:', error);
      throw new RpcException(
        `Error al procesar la contratación: ${error.message}`,
      );
    }
  }
}
