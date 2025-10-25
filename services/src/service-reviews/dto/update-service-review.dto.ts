import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateServiceReviewDto {
  @IsString()
  @MaxLength(500)
  @IsOptional()
  comment?: string;
}
