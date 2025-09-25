import { IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'price must be greater than 1' })
  price?: number;

  @IsOptional()
  @ValidateIf((o) => o.estimatedHours !== null)
  @IsNumber()
  @Min(1, { message: 'estimatedHours must be greater than or equal to 1 hour' })
  estimatedHours?: number | null;
}
