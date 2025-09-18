import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetUsersDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'page must be a number' },
  )
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'limit must be a number' },
  )
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search?: string;
}
