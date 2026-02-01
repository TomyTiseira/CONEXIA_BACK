import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ClaimStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  PENDING_CLARIFICATION = 'pending_clarification',
  REQUIRES_STAFF_RESPONSE = 'requires_staff_response',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

const ALLOWED_CLAIM_STATUSES = [
  ...Object.values(ClaimStatus),
  'requires_response',
  'pending_compliance',
  'reviewing_compliance',
] as const;

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
  @IsString()
  @IsIn(ALLOWED_CLAIM_STATUSES)
  status?: string;

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
