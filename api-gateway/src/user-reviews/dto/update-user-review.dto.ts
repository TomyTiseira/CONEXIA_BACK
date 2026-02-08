import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'relationship must not exceed 100 characters' })
  relationship?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
