import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ClaimStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  PENDING_CLARIFICATION = 'pending_clarification',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum ClaimRole {
  CLIENT = 'client',
  PROVIDER = 'provider',
}

export class GetClaimsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  hiringId?: number;

  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @IsOptional()
  @IsEnum(ClaimRole)
  claimantRole?: ClaimRole;

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
