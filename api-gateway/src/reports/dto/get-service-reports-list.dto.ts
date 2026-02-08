import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum OrderByServiceReport {
  REPORT_COUNT = 'reportCount',
  LAST_REPORT_DATE = 'lastReportDate',
}

export class GetServiceReportsListDto {
  @IsEnum(OrderByServiceReport)
  @IsOptional()
  orderBy?: OrderByServiceReport = OrderByServiceReport.REPORT_COUNT;

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
}
