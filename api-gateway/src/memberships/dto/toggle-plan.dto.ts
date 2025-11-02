import { IsBoolean } from 'class-validator';

export class TogglePlanDto {
  @IsBoolean({ message: 'active must be a boolean' })
  active!: boolean;
}
