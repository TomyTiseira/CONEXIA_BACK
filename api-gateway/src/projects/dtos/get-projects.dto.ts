import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GetProjectsDto {
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id) => Number(id.trim()));
    }
    return value;
  })
  @IsNumber(
    {},
    { each: true, message: 'categoryIds must be an array of numbers' },
  )
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id) => Number(id.trim()));
    }
    return value;
  })
  @IsNumber({}, { each: true, message: 'skillIds must be an array of numbers' })
  skillIds?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id) => Number(id.trim()));
    }
    return value;
  })
  @IsNumber(
    {},
    { each: true, message: 'collaborationTypeIds must be an array of numbers' },
  )
  collaborationTypeIds?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id) => Number(id.trim()));
    }
    return value;
  })
  @IsNumber(
    {},
    { each: true, message: 'contractTypeIds must be an array of numbers' },
  )
  contractTypeIds?: number[];

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'page must be greater than 0' })
  @Transform(({ value }) => Number(value))
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'limit must be greater than 0' })
  @Transform(({ value }) => Number(value))
  limit?: number;
}
