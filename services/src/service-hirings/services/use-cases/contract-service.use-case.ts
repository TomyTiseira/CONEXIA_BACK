import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ContractServiceDto, ContractServiceResponseDto } from '../../dto';
import { PaymentStatus } from '../../entities/payment.entity';
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
      // Crear registro de pago
      const payment = await this.paymentRepository.create({
        hiringId: hiring.id,
        amount: hiring.quotedPrice,
        status: PaymentStatus.PENDING,
        paymentMethod: contractDto.paymentMethod,
      });

      // Crear preferencia de MercadoPago
      const preference = {
        items: [
          {
            title: `Contratación de servicio: ${hiring.service.title}`,
            description: hiring.description,
            quantity: 1,
            unit_price: Number(hiring.quotedPrice),
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: `${process.env.FRONTEND_URL}/service-hirings/payment/success`,
          pending: `${process.env.FRONTEND_URL}/service-hirings/payment/pending`,
          failure: `${process.env.FRONTEND_URL}/service-hirings/payment/failure`,
        },
        notification_url: `${process.env.API_BASE_URL}/service-hirings/payment/notification`,
        external_reference: `hiring_${hiring.id}_payment_${payment.id}`,
        auto_return: 'approved' as const,
      };

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
