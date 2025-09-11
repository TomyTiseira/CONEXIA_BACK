import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteConnectionRequestDto {
  @IsNotEmpty()
  @IsNumber()
  requestId: number;
}
