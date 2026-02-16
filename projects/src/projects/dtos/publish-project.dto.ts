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
  IsIn,
} from 'class-validator';
import { ValidateNested, IsEnum, ValidateIf } from 'class-validator';

/**
 * DTO for uploading project image as base64
 */
export class ProjectImageDto {
  @IsString()
  @IsNotEmpty()
  fileData: string; // base64

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;
}

/**
 * DTO for uploading evaluation files as base64
 */
export class EvaluationFileDto {
  @IsString()
  @IsNotEmpty()
  fileData: string; // base64

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;
}

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

  @IsOptional()
  @IsBoolean({ message: 'requiresPartner must be a boolean' })
  requiresPartner?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'requiresInvestor must be a boolean' })
  requiresInvestor?: boolean;

  // New base64 approach for project image
  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectImageDto)
  imageFile?: ProjectImageDto;

  // Legacy URL approach (for backward compatibility)
  @IsString({ message: 'image must be a string' })
  @IsOptional()
  image?: string;

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

  @ValidateIf((o) => o.questionType === 'MULTIPLE_CHOICE')
  @IsArray({ message: 'options must be an array' })
  @ArrayMinSize(1, {
    message:
      'At least one option is required when questionType is MULTIPLE_CHOICE',
  })
  @ValidateNested({ each: true })
  @Type(() => OptionCreateDto)
  options?: OptionCreateDto[];
}

export class OptionCreateDto {
  @IsNotEmpty({ message: 'optionText is required' })
  @IsString({ message: 'optionText must be a string' })
  optionText: string;

  @IsOptional()
  @IsBoolean({ message: 'isCorrect must be a boolean' })
  isCorrect?: boolean;
}

export class RoleEvaluationCreateDto {
  @IsNotEmpty({ message: 'description is required' })
  @IsString({ message: 'description must be a string' })
  description: string;

  @IsOptional()
  @IsString({ message: 'link must be a string' })
  link?: string;

  // New base64 approach for evaluation file
  @IsOptional()
  @ValidateNested()
  @Type(() => EvaluationFileDto)
  evaluationFile?: EvaluationFileDto;

  // Legacy approach (for backward compatibility)
  @IsOptional()
  @IsString({ message: 'fileUrl must be a string' })
  fileUrl?: string;

  @IsOptional()
  @IsString({ message: 'fileName must be a string' })
  fileName?: string;

  @IsOptional()
  @IsNumber({}, { message: 'fileSize must be a number' })
  @IsPositive({ message: 'fileSize must be a positive number' })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  fileSize?: number;

  @IsOptional()
  @IsString({ message: 'fileMimeType must be a string' })
  @IsIn(['image/png', 'image/jpeg', 'application/pdf'], {
    message:
      'fileMimeType must be one of: image/png, image/jpeg, application/pdf',
  })
  fileMimeType?: string;

  @IsOptional()
  @IsNumber({}, { message: 'days must be a number' })
  @IsPositive({ message: 'days must be a positive number' })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  days?: number;
}

export enum ApplicationType {
  CV = 'CV',
  QUESTIONS = 'QUESTIONS',
  EVALUATION = 'EVALUATION',
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
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((v: any) => Number(v)) : value,
  )
  @IsPositive({ each: true, message: 'each skillId must be a positive number' })
  skills?: number[];

  @IsArray({ message: 'applicationTypes must be an array' })
  @ArrayMinSize(1, { message: 'At least one applicationType is required' })
  @IsEnum(ApplicationType, { each: true })
  applicationTypes: ApplicationType[];

  @ValidateIf(
    (o) =>
      Array.isArray(o.applicationTypes) &&
      o.applicationTypes.includes(ApplicationType.QUESTIONS),
  )
  @IsArray({ message: 'questions must be an array' })
  @ArrayMinSize(1, {
    message:
      'At least one question is required when applicationTypes includes QUESTIONS',
  })
  @ValidateNested({ each: true })
  @Type(() => RoleQuestionCreateDto)
  questions?: RoleQuestionCreateDto[];

  @ValidateIf(
    (o) =>
      Array.isArray(o.applicationTypes) &&
      o.applicationTypes.includes(ApplicationType.EVALUATION),
  )
  @ValidateNested()
  @Type(() => RoleEvaluationCreateDto)
  evaluation?: RoleEvaluationCreateDto;
}
