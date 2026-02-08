import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GetUserReviewsDto {
  @IsInt()
  @Min(1)
  userId: number;

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
  @Transform(({ value }) => (value ? Number(value) : undefined))
  currentUserId?: number;
}
