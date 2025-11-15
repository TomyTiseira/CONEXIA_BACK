import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ArrayMinSize,
} from 'class-validator';
import { ValidateNested, IsEnum } from 'class-validator';

export class PublishProjectDto {
  @IsNumber({}, { message: 'userId must be a number' })
  @IsPositive({ message: 'userId must be a positive number' })
  @IsNotEmpty({ message: 'userId is required' })
  @Transform(({ value }) => Number(value))
  userId: number;

  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title: string;

  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description is required' })
  description: string;

  @IsNumber({}, { message: 'categoryId must be a number' })
  @IsPositive({ message: 'categoryId must be a positive number' })
  categoryId: number;

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

  // Project-level flags: whether the project requires a partner and/or collaborators
  @IsOptional()
  @IsBoolean({ message: 'requiresPartner must be a boolean' })
  requiresPartner?: boolean;

  // Flag indicating the project requires an investor
  @IsOptional()
  @IsBoolean({ message: 'requiresInvestor must be a boolean' })
  requiresInvestor?: boolean;

  @IsString({ message: 'image must be a string' })
  @IsOptional()
  image?: string;

  // Roles definitions
  @IsArray({ message: 'roles must be an array' })
  @ArrayMinSize(1, { message: 'At least one role is required' })
  @ValidateNested({ each: true })
  @Type(() => RoleCreateDto)
  roles: RoleCreateDto[];
}

export class RoleQuestionCreateDto {
  @IsNotEmpty({ message: 'questionText is required' })
  @IsString({ message: 'questionText must be a string' })
  questionText: string;

  @IsNotEmpty({ message: 'questionType is required' })
  @IsString({ message: 'questionType must be a string' })
  questionType: 'OPEN' | 'MULTIPLE_CHOICE';

  @IsOptional()
  @IsArray({ message: 'options must be an array' })
  options?: string[];
}

export class RoleEvaluationCreateDto {
  @IsNotEmpty({ message: 'description is required' })
  @IsString({ message: 'description must be a string' })
  description: string;

  @IsOptional()
  @IsString({ message: 'link must be a string' })
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
  @IsNotEmpty({ message: 'title is required' })
  @IsString({ message: 'title must be a string' })
  title: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'contractTypeId must be a number' })
  @IsPositive({ message: 'contractTypeId must be a positive number' })
  contractTypeId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'collaborationTypeId must be a number' })
  @IsPositive({ message: 'collaborationTypeId must be a positive number' })
  collaborationTypeId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'maxCollaborators must be a number' })
  @IsPositive({ message: 'maxCollaborators must be a positive number' })
  maxCollaborators?: number;

  @IsOptional()
  @IsArray({ message: 'skills must be an array' })
  @IsNumber({}, { each: true, message: 'each skillId must be a number' })
  @IsPositive({ each: true, message: 'each skillId must be a positive number' })
  skills?: number[];

  @IsArray({ message: 'applicationTypes must be an array' })
  @IsEnum(ApplicationType, { each: true })
  applicationTypes: ApplicationType[];

  @IsOptional()
  @IsArray({ message: 'questions must be an array' })
  @ValidateNested({ each: true })
  @Type(() => RoleQuestionCreateDto)
  questions?: RoleQuestionCreateDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoleEvaluationCreateDto)
  evaluation?: RoleEvaluationCreateDto;
}
