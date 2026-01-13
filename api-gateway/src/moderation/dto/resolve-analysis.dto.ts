import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ResolutionAction {
  BAN_USER = 'ban_user',
  SUSPEND_USER = 'suspend_user',
  RELEASE_USER = 'release_user',
  KEEP_MONITORING = 'keep_monitoring',
}

export class ResolveAnalysisDto {
  @IsEnum(ResolutionAction)
  action: ResolutionAction;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(30)
  suspensionDays?: number; // Solo para suspend_user: 7, 15 o 30 días
}
