import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetServiceReportsDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 10;
}
