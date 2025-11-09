import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePostulationDto {
  @IsNotEmpty({ message: 'projectId is required' })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  projectId: number;

  @IsNotEmpty({ message: 'roleId is required' })
  @IsNumber()
  @Transform(({ value }) => Number(value))
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
  @Transform(({ value }) => (value ? Number(value) : undefined))
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
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  investorAmount?: number;

  @IsOptional()
  @IsString()
  investorMessage?: string;

  @IsOptional()
  @IsString()
  partnerDescription?: string;
}
