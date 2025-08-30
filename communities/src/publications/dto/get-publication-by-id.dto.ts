import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class GetPublicationByIdDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'ID debe ser un número válido' })
  @IsPositive({ message: 'ID debe ser un número positivo mayor a 0' })
  id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'currentUserId debe ser un número válido' })
  currentUserId?: number;
}
