import { IsNumber, IsOptional } from 'class-validator';

export class GetRecommendationsDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'userId must be a number' },
  )
  userId: number;

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'limit must be a number' },
  )
  limit?: number = 12;

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'page must be a number' },
  )
  page?: number = 1;
}
