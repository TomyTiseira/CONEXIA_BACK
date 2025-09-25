import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateQuotationDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quotedPrice: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  estimatedHours: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  quotationNotes?: string;
}
