import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePostulationDto {
  @IsNotEmpty({ message: 'projectId is required' })
  @IsNumber()
  projectId: number;

  @IsNotEmpty({ message: 'roleId is required' })
  @IsNumber()
  roleId: number;

  // CV fields (optional depending on role type)
  @IsOptional()
  @IsString()
  cvUrl?: string;

  @IsOptional()
  @IsString()
  cvFilename?: string;

  @IsOptional()
  @IsNumber()
  cvSize?: number;

  // Answers for questions
  @IsOptional()
  @IsArray()
  answers?: { questionId: number; optionId?: number; answerText?: string }[];

  // Evaluation submission fields
  @IsOptional()
  @IsString()
  evaluationLink?: string;

  @IsOptional()
  @IsString()
  evaluationFileUrl?: string;

  // Investor / Partner specific
  @IsOptional()
  investorAmount?: number;

  @IsOptional()
  @IsString()
  investorMessage?: string;

  @IsOptional()
  @IsString()
  partnerDescription?: string;
}
