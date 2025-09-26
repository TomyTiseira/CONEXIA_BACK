import {
  BankAccountType,
  PaymentAccountType,
} from '../../shared/entities/payment-account.entity';

export class PaymentAccountResponseDto {
  id: number;
  type: PaymentAccountType;
  bankId?: number;
  bankName?: string;
  bankAccountType?: BankAccountType;
  digitalPlatformId?: number;
  digitalPlatformName?: string;
  cbu: string;
  alias?: string;
  accountHolderName: string;
  cuilCuit: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
