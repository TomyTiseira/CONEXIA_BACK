import { IsNumber, IsPositive } from 'class-validator';

export class RejectPostulationDto {
  @IsNumber({}, { message: 'postulationId must be a number' })
  @IsPositive({ message: 'postulationId must be a positive number' })
  postulationId: number;
}
