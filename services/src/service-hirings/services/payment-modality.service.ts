import { Injectable } from '@nestjs/common';
import { PaymentModalityResponseDto } from '../dto/payment-modality-response.dto';
import { PaymentModalityRepository } from '../repositories/payment-modality.repository';

@Injectable()
export class PaymentModalityService {
  constructor(
    private readonly paymentModalityRepository: PaymentModalityRepository,
  ) {}

  async getAllPaymentModalities(): Promise<PaymentModalityResponseDto[]> {
    const modalities = await this.paymentModalityRepository.findAll();
    return modalities.map((modality) => ({
      id: modality.id,
      name: modality.name,
      code: modality.code,
      description: modality.description,
      initialPaymentPercentage: modality.initialPaymentPercentage,
      finalPaymentPercentage: modality.finalPaymentPercentage,
      isActive: modality.isActive,
    }));
  }
}
