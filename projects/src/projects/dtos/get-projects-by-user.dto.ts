import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class GetProjectsByUserDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  currentUserId: number;

  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'page must be greater than 0' })
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'limit must be greater than 0' })
  limit?: number;
}
