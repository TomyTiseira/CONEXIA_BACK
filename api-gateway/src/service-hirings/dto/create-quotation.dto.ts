import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TimeUnit } from '../../services/dto/time-unit.enum';

export class CreateQuotationDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quotedPrice: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  estimatedHours: number;

  @IsNotEmpty()
  @IsEnum(TimeUnit, {
    message:
      'estimatedTimeUnit must be a valid time unit (hours, days, weeks, months)',
  })
  estimatedTimeUnit: TimeUnit;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  quotationNotes?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'quotationValidityDays must be at least 1 day' })
  quotationValidityDays: number;

  @IsOptional()
  @IsBoolean()
  isBusinessDays?: boolean;
}
