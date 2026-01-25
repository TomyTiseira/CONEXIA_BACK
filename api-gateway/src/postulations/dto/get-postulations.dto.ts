import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetPostulationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  statusId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  roleId?: number;

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
