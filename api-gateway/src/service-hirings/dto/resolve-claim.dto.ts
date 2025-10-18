import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export enum ClaimResolutionStatus {
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export class ResolveClaimDto {
  @IsEnum(ClaimResolutionStatus, {
    message: 'El estado debe ser RESOLVED o REJECTED',
  })
  status: ClaimResolutionStatus;

  @IsString()
  @MinLength(20, {
    message: 'La resolución debe tener al menos 20 caracteres',
  })
  @MaxLength(2000, {
    message: 'La resolución no puede exceder 2000 caracteres',
  })
  resolution: string;
}
