import { IsNumber, IsPositive } from 'class-validator';

export class CancelPostulationDto {
  @IsNumber()
  @IsPositive()
  postulationId: number;

  @IsNumber()
  @IsPositive()
  currentUserId: number;
}
