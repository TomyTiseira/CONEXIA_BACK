import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitEvaluationDto {
  @IsNotEmpty({ message: 'postulationId is required' })
  @IsNumber()
  postulationId: number;

  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber()
  userId: number;

  // Evaluation file fields
  @IsOptional()
  @IsString()
  evaluationData?: string; // Base64 encoded file data

  @IsOptional()
  @IsString()
  evaluationOriginalName?: string;

  @IsOptional()
  @IsString()
  evaluationMimetype?: string;

  // Optional link to external evaluation (e.g., GitHub repo, deployed app)
  @IsOptional()
  @IsString()
  evaluationLink?: string;

  @IsOptional()
  @IsString()
  evaluationDescription?: string;
}
