import { IsOptional, IsString } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsString()
  payment_id: string;

  @IsString()
  status: string;

  @IsString()
  external_reference: string;

  @IsOptional()
  @IsString()
  merchant_order_id?: string;

  @IsOptional()
  @IsString()
  preference_id?: string;
}
