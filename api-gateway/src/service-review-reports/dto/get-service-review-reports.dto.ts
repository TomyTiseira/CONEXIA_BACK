import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum OrderByServiceReviewReport {
  REPORT_COUNT = 'reportCount',
  LAST_REPORT_DATE = 'lastReportDate',
}

export class GetServiceReviewReportsDto {
  // Si serviceReviewId está presente: obtener reportes de esa reseña específica
  // Si no está presente: obtener lista de reseñas reportadas
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  serviceReviewId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  // Solo usado cuando NO hay serviceReviewId (lista de reseñas reportadas)
  @IsOptional()
  @IsEnum(OrderByServiceReviewReport)
  orderBy?: OrderByServiceReviewReport;
}
