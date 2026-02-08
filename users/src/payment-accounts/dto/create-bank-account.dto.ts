import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { BankAccountType } from '../../shared/entities/payment-account.entity';

export class CreateBankAccountDto {
  @IsNumber()
  @IsNotEmpty()
  bankId: number;

  @IsEnum(BankAccountType)
  @IsNotEmpty()
  bankAccountType: BankAccountType;

  @IsString()
  @IsNotEmpty()
  cbu: string;

  @IsString()
  @IsNotEmpty()
  alias: string;

  @IsString()
  @IsOptional()
  customName?: string;

  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @IsString()
  @IsNotEmpty()
  cuilCuit: string;
}
