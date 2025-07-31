import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

class ExecutionPeriodDto {
  @IsDateString({}, { message: 'startDate must be a valid date' })
  @IsNotEmpty({ message: 'startDate is required' })
  startDate: Date;

  @IsDateString({}, { message: 'endDate must be a valid date' })
  @IsNotEmpty({ message: 'endDate is required' })
  endDate: Date;
}

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
  @IsObject({ message: 'executionPeriod must be an object' })
  @ValidateNested()
  @Type(() => ExecutionPeriodDto)
  executionPeriod?: ExecutionPeriodDto;

  @IsOptional()
  @IsString({ message: 'location must be a string' })
  @IsNotEmpty({ message: 'location is required' })
  location?: string;

  @IsNumber({}, { message: 'contractTypeId must be a number' })
  @IsPositive({ message: 'contractTypeId must be a positive number' })
  @Transform(({ value }) => Number(value))
  contractTypeId: number;

  @IsOptional()
  @IsNumber({}, { message: 'maxCollaborators must be a number' })
  @IsPositive({ message: 'maxCollaborators must be a positive number' })
  @Transform(({ value }) => Number(value))
  maxCollaborators?: number;
}
