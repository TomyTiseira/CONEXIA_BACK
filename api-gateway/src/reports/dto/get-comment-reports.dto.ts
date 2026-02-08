import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum OrderByCommentReport {
  REPORT_COUNT = 'reportCount',
  LAST_REPORT_DATE = 'lastReportDate',
}

export class GetCommentReportsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(OrderByCommentReport)
  orderBy?: OrderByCommentReport = OrderByCommentReport.LAST_REPORT_DATE;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  commentId?: number;
}
