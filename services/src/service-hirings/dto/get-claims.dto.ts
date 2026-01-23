import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ClaimRole, ClaimStatus } from '../enums/claim.enum';

const CLAIM_FILTER_STATUSES = [
  ...Object.values(ClaimStatus),
  'requires_response',
  'pending_compliance',
  'reviewing_compliance',
] as const;

export class GetClaimsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  hiringId?: number;

  @IsOptional()
  @IsString()
  @IsIn(CLAIM_FILTER_STATUSES)
  status?: string;

  @IsOptional()
  @IsEnum(ClaimRole)
  claimantRole?: ClaimRole;

  @IsOptional()
  @IsString()
  searchTerm?: string; // Buscar por ID del reclamo o nombre del reclamante

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
