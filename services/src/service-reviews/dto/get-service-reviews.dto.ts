import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetServiceReviewsDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;
}
