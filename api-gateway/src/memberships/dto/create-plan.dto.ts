import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BenefitAssignmentDto {
  @IsString({ message: 'key must be a string' })
  @IsNotEmpty({ message: 'key should not be empty' })
  key!: string;

  // value can be boolean/number/string; we don't strictly validate type here
  @IsOptional()
  value?: any;
}

export class CreatePlanDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name should not be empty' })
  name!: string;

  @IsString({ message: 'description must be a string' })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'monthlyPrice must be a number' })
  monthlyPrice!: number;

  @IsNumber({}, { message: 'annualPrice must be a number' })
  annualPrice!: number;

  @IsArray({ message: 'benefits must be an array' })
  @ValidateNested({ each: true })
  @Type(() => BenefitAssignmentDto)
  benefits!: BenefitAssignmentDto[];

  @IsBoolean({ message: 'active must be a boolean' })
  @IsOptional()
  active?: boolean;
}
