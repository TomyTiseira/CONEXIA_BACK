import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetPublicationReportsDetailDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  publicationId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
