import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class GetReportsDto {
  @IsOptional()
  @IsIn(['reportCount', 'lastReportDate'])
  orderBy?: 'reportCount' | 'lastReportDate' = 'reportCount';

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
