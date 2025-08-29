import { Transform } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class PublicationIdDto {
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'id must be a number' })
  @IsPositive({ message: 'id must be a positive number' })
  id: number;
}
