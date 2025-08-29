import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class DeletePublicationDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'ID debe ser un número válido' })
  @IsPositive({ message: 'ID debe ser un número positivo mayor a 0' })
  id: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'userId debe ser un número válido' })
  @IsPositive({ message: 'userId debe ser un número positivo' })
  userId: number;
}
