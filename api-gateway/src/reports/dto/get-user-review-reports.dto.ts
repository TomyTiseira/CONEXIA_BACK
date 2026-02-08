import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum OrderByUserReviewReport {
  REPORT_COUNT = 'reportCount',
  LAST_REPORT_DATE = 'lastReportDate',
}

export class GetUserReviewReportsDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 10;

  @IsEnum(OrderByUserReviewReport)
  @IsOptional()
  orderBy?: OrderByUserReviewReport = OrderByUserReviewReport.REPORT_COUNT;
}
