import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class GetFriendsDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  userId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 12;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;
}
