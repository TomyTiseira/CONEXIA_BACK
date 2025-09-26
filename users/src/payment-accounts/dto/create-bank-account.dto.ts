import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
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
  @ValidateIf((o) => !o.alias)
  cbu: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.cbu)
  alias?: string;

  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @IsString()
  @IsNotEmpty()
  cuilCuit: string;
}
