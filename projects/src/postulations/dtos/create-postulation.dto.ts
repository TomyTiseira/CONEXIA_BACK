import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PostulationAnswerDto {
  @IsNotEmpty({ message: 'questionId is required' })
  @IsNumber()
  questionId: number;

  @IsOptional()
  @IsNumber()
  optionId?: number;

  @IsOptional()
  @IsString()
  answerText?: string;
}

export class CreatePostulationDto {
  @IsNotEmpty({ message: 'projectId is required' })
  @IsNumber()
  projectId: number;

  @IsNotEmpty({ message: 'roleId is required' })
  @IsNumber()
  roleId: number;

  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  cvUrl?: string;

  @IsOptional()
  @IsString()
  cvFilename?: string;

  @IsOptional()
  @IsNumber()
  cvSize?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostulationAnswerDto)
  answers?: PostulationAnswerDto[];

  @IsOptional()
  @IsNumber()
  investorAmount?: number;

  @IsOptional()
  @IsString()
  investorMessage?: string;

  @IsOptional()
  @IsString()
  partnerDescription?: string;
}
