import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ResolutionAction {
  BAN_USER = 'ban_user',
  SUSPEND_USER = 'suspend_user',
  RELEASE_USER = 'release_user',
  KEEP_MONITORING = 'keep_monitoring',
}

export class ResolveModerationAnalysisDto {
  @IsInt()
  @IsNotEmpty()
  analysisId: number;

  @IsEnum(ResolutionAction)
  @IsNotEmpty()
  action: ResolutionAction;

  @IsInt()
  @IsNotEmpty()
  moderatorId: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @Min(7)
  @Max(30)
  @IsOptional()
  suspensionDays?: number; // Solo para suspend_user: 7, 15, 30
}
