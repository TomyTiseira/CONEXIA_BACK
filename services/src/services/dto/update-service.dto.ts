import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { TimeUnit } from '../enums/time-unit.enum';

export class UpdateServiceDto {
  @IsOptional()
  @IsNumber({}, { message: 'El precio cotizado debe ser un número válido' })
  @IsPositive({ message: 'El precio cotizado debe ser mayor a 0' })
  quotedPrice?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Las horas estimadas deben ser un número válido' })
  @IsPositive({ message: 'Las horas estimadas deben ser mayor a 0' })
  estimatedHours?: number;

  @IsOptional()
  @IsEnum(TimeUnit, {
    message: 'La unidad de tiempo debe ser hours, days, weeks o months',
  })
  timeUnit?: TimeUnit;
}
