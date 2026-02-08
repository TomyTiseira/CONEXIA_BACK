import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum BankAccountType {
  SAVINGS = 'savings',
  CHECKING = 'checking',
}

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
