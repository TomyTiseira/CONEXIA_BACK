import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class GetProjectsByUserDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  currentUserId: number;

  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;
}
