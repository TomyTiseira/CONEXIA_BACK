import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ResolutionAction {
  BAN_USER = 'ban_user',
  RELEASE_USER = 'release_user',
  KEEP_MONITORING = 'keep_monitoring',
}

export class ResolveAnalysisDto {
  @IsEnum(ResolutionAction)
  action: ResolutionAction;

  @IsOptional()
  @IsString()
  notes?: string;
}
