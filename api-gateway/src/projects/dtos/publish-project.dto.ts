import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ValidateNested, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PublishProjectDto {
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title: string;

  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description is required' })
  description: string;

  @IsNumber({}, { message: 'categoryId must be a number' })
  @IsPositive({ message: 'categoryId must be a positive number' })
  @Transform(({ value }) => Number(value))
  categoryId: number;

  @IsOptional()
  @IsArray({ message: 'skillIds must be an array' })
  @IsNumber({}, { each: true, message: 'each skillId must be a number' })
  @IsPositive({ each: true, message: 'each skillId must be a positive number' })
  @Transform(({ value }) => value.map((v: string) => Number(v)))
  skills?: number[];

  @IsNumber({}, { message: 'collaborationTypeId must be a number' })
  @IsPositive({ message: 'collaborationTypeId must be a positive number' })
  @Transform(({ value }) => Number(value))
  collaborationTypeId: number;

  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid date' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid date' })
  endDate?: string;

  @IsOptional()
  @IsNumber({}, { message: 'location must be a number' })
  @IsPositive({ message: 'location must be a positive number' })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  location?: number;

  @IsNumber({}, { message: 'contractTypeId must be a number' })
  @IsPositive({ message: 'contractTypeId must be a positive number' })
  @Transform(({ value }) => Number(value))
  contractTypeId: number;

  @IsOptional()
  @IsNumber({}, { message: 'maxCollaborators must be a number' })
  @IsPositive({ message: 'maxCollaborators must be a positive number' })
  @Transform(({ value }) => Number(value))
  maxCollaborators?: number;

  // Roles definitions
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleCreateDto)
  roles?: RoleCreateDto[];
}

export class RoleQuestionCreateDto {
  @IsString()
  questionText: string;

  @IsString()
  questionType: 'OPEN' | 'MULTIPLE_CHOICE';

  @IsOptional()
  @IsArray()
  options?: string[];
}

export class RoleEvaluationCreateDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  link?: string;
}

export enum ApplicationType {
  CV = 'CV',
  QUESTIONS = 'QUESTIONS',
  EVALUATION = 'EVALUATION',
  MIXED = 'MIXED',
  INVESTOR = 'INVESTOR',
  PARTNER = 'PARTNER',
}

export class RoleCreateDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  vacancies?: number;

  @IsOptional()
  @IsNumber({}, { message: 'contractTypeId must be a number' })
  @IsPositive({ message: 'contractTypeId must be a positive number' })
  contractTypeId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'collaborationTypeId must be a number' })
  @IsPositive({ message: 'collaborationTypeId must be a positive number' })
  collaborationTypeId?: number;

  @IsEnum(ApplicationType)
  applicationType: ApplicationType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleQuestionCreateDto)
  questions?: RoleQuestionCreateDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RoleEvaluationCreateDto)
  evaluation?: RoleEvaluationCreateDto;
}
