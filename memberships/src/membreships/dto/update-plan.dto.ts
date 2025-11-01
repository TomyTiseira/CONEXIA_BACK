import { PartialType } from '@nestjs/mapped-types';
import { IsNumber } from 'class-validator';
import { CreatePlanDto } from './create-plan.dto';

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
  @IsNumber()
  id!: number;
}
