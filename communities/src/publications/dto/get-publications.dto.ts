import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class GetPublicationsDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'currentUserId debe ser un número válido' })
  @IsPositive({ message: 'currentUserId debe ser un número positivo' })
  currentUserId: number;
}
