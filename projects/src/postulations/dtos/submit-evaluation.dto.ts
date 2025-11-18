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
  evaluationFileUrl?: string;

  @IsOptional()
  @IsString()
  evaluationFilename?: string;

  @IsOptional()
  @IsNumber()
  evaluationFileSize?: number;

  @IsOptional()
  @IsString()
  evaluationFileMimetype?: string;

  // Optional link to external evaluation (e.g., GitHub repo, deployed app)
  @IsOptional()
  @IsString()
  evaluationLink?: string;

  @IsOptional()
  @IsString()
  evaluationDescription?: string;
}
