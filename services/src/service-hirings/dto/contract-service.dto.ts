import { IsEnum, IsNotEmpty } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class ContractServiceDto {
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class ContractServiceResponseDto {
  success: boolean;
  message: string;
  data?: {
    paymentId: number;
    mercadoPagoUrl?: string;
    preferenceId?: string;
  };
}
