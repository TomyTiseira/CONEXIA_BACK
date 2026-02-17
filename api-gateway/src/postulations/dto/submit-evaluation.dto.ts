import { IsOptional, IsString } from 'class-validator';

export class SubmitEvaluationDto {
  // Evaluation file fields
  @IsOptional()
  @IsString({ message: 'evaluationData must be a string' })
  evaluationData?: string; // Base64 encoded file data

  @IsOptional()
  @IsString({ message: 'evaluationOriginalName must be a string' })
  evaluationOriginalName?: string;

  @IsOptional()
  @IsString({ message: 'evaluationMimetype must be a string' })
  evaluationMimetype?: string;

  // Optional link to external evaluation (e.g., GitHub repo, deployed app)
  @IsOptional()
  @IsString({ message: 'evaluationLink must be a string' })
  evaluationLink?: string;

  // Optional text description/notes for the evaluation
  @IsOptional()
  @IsString({ message: 'evaluationDescription must be a string' })
  evaluationDescription?: string;
}
