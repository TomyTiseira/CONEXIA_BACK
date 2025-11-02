import { IsBoolean, IsNumber } from 'class-validator';

export class TogglePlanDto {
  @IsNumber()
  id: number;

  @IsBoolean()
  active: boolean;

  @IsNumber()
  adminUserId: number;
}
