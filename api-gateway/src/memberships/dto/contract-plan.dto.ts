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

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
