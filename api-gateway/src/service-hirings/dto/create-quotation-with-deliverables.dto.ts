import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateDeliverableDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description: string;

  @IsNotEmpty()
  @IsDateString()
  estimatedDeliveryDate: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateQuotationWithDeliverablesDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  paymentModalityId: number;

  // Campos comunes para ambas modalidades
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  estimatedHours: number;

  @IsNotEmpty()
  @IsString()
  estimatedTimeUnit: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  quotationNotes?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'quotationValidityDays must be at least 1 day' })
  quotationValidityDays: number;

  // Para modalidad "Pago total al finalizar"
  @IsOptional()
  @IsNumber()
  @Min(0)
  quotedPrice?: number;

  // Para modalidad "Pago por entregables"
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliverableDto)
  deliverables?: CreateDeliverableDto[];
}
