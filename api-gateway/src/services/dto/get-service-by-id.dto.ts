import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetServiceByIdDto {
  @Type(() => Number)
  @IsNumber()
  id: number;

  @Type(() => Number)
  @IsNumber()
  currentUserId: number;
}
