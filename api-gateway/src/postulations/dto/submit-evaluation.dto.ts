import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitEvaluationDto {
  // Evaluation file fields
  @IsOptional()
  @IsString({ message: 'evaluationFileUrl must be a string' })
  evaluationFileUrl?: string;

  @IsOptional()
  @IsString({ message: 'evaluationFilename must be a string' })
  evaluationFilename?: string;

  @IsOptional()
  @IsNumber({}, { message: 'evaluationFileSize must be a number' })
  evaluationFileSize?: number;

  @IsOptional()
  @IsString({ message: 'evaluationFileMimetype must be a string' })
  evaluationFileMimetype?: string;

  // Optional link to external evaluation (e.g., GitHub repo, deployed app)
  @IsOptional()
  @IsString({ message: 'evaluationLink must be a string' })
  evaluationLink?: string;

  // Optional text description/notes for the evaluation
  @IsOptional()
  @IsString({ message: 'evaluationDescription must be a string' })
  evaluationDescription?: string;
}
