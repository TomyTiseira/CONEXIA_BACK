import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetFriendsDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;
}
