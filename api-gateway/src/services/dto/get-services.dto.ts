import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetServicesDto {
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber(
    {},
    { each: true, message: 'categoryIds must be an array of numbers' },
  )
  categoryIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minRating must be a number' })
  @Min(0, { message: 'minRating must be between 0 and 5' })
  @Max(5, { message: 'minRating must be between 0 and 5' })
  minRating?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'page must be greater than 0' })
  page?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'limit must be greater than 0' })
  limit?: number;
}
