import { IsNotEmpty, IsNumber } from 'class-validator';

export class ApprovePostulationDto {
  @IsNotEmpty()
  @IsNumber()
  postulationId: number;

  @IsNotEmpty()
  @IsNumber()
  currentUserId: number;
}
