import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class GetUserPublicationsDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'userId debe ser un número válido' })
  @IsPositive({ message: 'userId debe ser un número positivo' })
  userId: number;
}
