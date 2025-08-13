import { IsNotEmpty, IsNumber } from 'class-validator';

export class ApprovePostulationDto {
  @IsNotEmpty({ message: 'postulationId is required' })
  @IsNumber({}, { message: 'postulationId must be a number' })
  postulationId: number;
}
