import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
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
