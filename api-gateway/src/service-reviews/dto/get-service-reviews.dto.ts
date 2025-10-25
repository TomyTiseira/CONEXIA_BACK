import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetServiceReviewsDto {
  @IsInt()
  @IsOptional()
  @Min(1, { message: 'page must be greater than 0' })
  @Transform(({ value }) => Number(value))
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Min(1, { message: 'limit must be greater than 0' })
  @Transform(({ value }) => Number(value))
  limit?: number = 10;

  @IsInt()
  @IsOptional()
  @Min(1, { message: 'rating must be between 1 and 5' })
  @Max(5, { message: 'rating must be between 1 and 5' })
  @Transform(({ value }) => Number(value))
  rating?: number;
}
