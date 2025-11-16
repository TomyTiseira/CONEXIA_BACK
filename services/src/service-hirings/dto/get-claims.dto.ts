import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ClaimRole, ClaimStatus } from '../enums/claim.enum';

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
