import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class GetServicesByUserDto {
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @Type(() => Number)
  @IsNumber()
  currentUserId: number;

  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;

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
