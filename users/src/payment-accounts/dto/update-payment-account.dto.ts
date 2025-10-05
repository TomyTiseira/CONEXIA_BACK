import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentAccountDto {
  @IsString()
  @IsNotEmpty()
  alias: string;

  @IsString()
  @IsOptional()
  customName?: string;
}
