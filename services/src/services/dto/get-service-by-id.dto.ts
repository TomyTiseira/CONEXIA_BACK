import { IsNumber } from 'class-validator';

export class GetServiceByIdDto {
  @IsNumber()
  id: number;

  @IsNumber()
  currentUserId: number;
}
