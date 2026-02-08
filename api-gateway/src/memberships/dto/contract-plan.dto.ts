import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export class ContractPlanDto {
  @IsInt()
  @IsPositive()
  planId: number;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsString()
  cardTokenId: string; // Token de tarjeta de MercadoPago para suscripciones recurrentes

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
