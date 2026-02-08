import { IsOptional, IsString } from 'class-validator';

export class UpdateServiceReviewDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
