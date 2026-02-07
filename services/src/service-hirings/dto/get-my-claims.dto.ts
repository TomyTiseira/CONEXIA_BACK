import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetMyClaimsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(['claimant', 'respondent', 'all'])
  role?: 'claimant' | 'respondent' | 'all' = 'all';

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt'])
  sortBy?: 'createdAt' | 'updatedAt' = 'updatedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
