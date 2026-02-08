import { Transform } from 'class-transformer';
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

  @IsOptional()
  @IsArray()
  answers?: { questionId: number; optionId?: number; answerText?: string }[];

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
