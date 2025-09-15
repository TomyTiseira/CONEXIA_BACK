import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum OrderByPublicationReport {
  REPORT_COUNT = 'reportCount',
  LAST_REPORT_DATE = 'lastReportDate',
}

export class GetPublicationReportsDto {
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

  @IsOptional()
  @IsEnum(OrderByPublicationReport)
  orderBy?: OrderByPublicationReport = OrderByPublicationReport.REPORT_COUNT;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  publicationId?: number;
}
