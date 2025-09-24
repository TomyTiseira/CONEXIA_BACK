import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
