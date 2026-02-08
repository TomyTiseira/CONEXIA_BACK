import { IsNumber } from 'class-validator';

export class ServiceIdDto {
  @IsNumber()
  id: number;
}
