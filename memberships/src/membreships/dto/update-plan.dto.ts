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

class UpdatePlanBenefitDto {
  @IsString()
  key!: string;

  @IsNotEmpty()
  value!: unknown;
}

export class UpdatePlanDto {
  @IsNumber()
  id!: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  monthlyPrice?: number;

  @IsNumber()
  @IsOptional()
  annualPrice?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePlanBenefitDto)
  @IsOptional()
  benefits?: UpdatePlanBenefitDto[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  adminUserId!: number;
}
