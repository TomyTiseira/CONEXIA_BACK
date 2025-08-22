import { IsNumber, IsPositive } from 'class-validator';

export class RejectPostulationDto {
  @IsNumber()
  @IsPositive()
  postulationId: number;

  @IsNumber()
  @IsPositive()
  currentUserId: number;
}
