import { BankAccountType } from './create-bank-account.dto';

export enum PaymentAccountType {
  BANK_ACCOUNT = 'bank_account',
  DIGITAL_ACCOUNT = 'digital_account',
}

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
  customName?: string;
  accountHolderName: string;
  cuilCuit: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
