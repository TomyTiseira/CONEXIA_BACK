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

export class PlanBenefitDto {
  @IsString()
  key: string;

  @IsNotEmpty()
  value: unknown;
}

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  monthlyPrice: number;

  @IsNumber()
  annualPrice: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanBenefitDto)
  benefits: PlanBenefitDto[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  adminUserId: number;
}
