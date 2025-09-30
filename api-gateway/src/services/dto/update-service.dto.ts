import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';
import { TimeUnit } from './time-unit.enum';

export class UpdateServiceDto {
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'price must be a number' })
  @Min(1, { message: 'price must be greater than 1' })
  price?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return parseInt(value, 10);
  })
  @ValidateIf((o) => o.estimatedHours !== null)
  @IsNumber({}, { message: 'estimatedHours must be a number' })
  @Min(1, { message: 'estimatedHours must be greater than or equal to 1 hour' })
  estimatedHours?: number | null;

  @IsOptional()
  @IsEnum(TimeUnit)
  timeUnit?: TimeUnit;
}
