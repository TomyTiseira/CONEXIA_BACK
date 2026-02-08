import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetServiceReviewsDto {
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'page must be greater than 0' })
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'limit must be greater than 0' })
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'rating must be between 1 and 5' })
  @Max(5, { message: 'rating must be between 1 and 5' })
  rating?: number;
}
