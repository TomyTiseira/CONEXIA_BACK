import { IsEnum, IsNotEmpty } from 'class-validator';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
}

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
