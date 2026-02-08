import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { BillingCycle } from '../entities/membreship.entity';

export class ContractPlanDto {
  @IsInt()
  @IsPositive()
  planId: number;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsString()
  cardTokenId: string; // Token de tarjeta de MercadoPago para cobros recurrentes

  @IsOptional()
  @IsInt()
  @IsPositive()
  paymentMethodId?: number; // Futuro: para métodos de pago guardados
}
