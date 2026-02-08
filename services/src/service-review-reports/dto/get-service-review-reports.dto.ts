import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { OrderByServiceReviewReport } from '../enums/orderby-service-review-report.enum';

export class GetServiceReviewReportsDto {
  // Si serviceReviewId está presente: obtener reportes de esa reseña específica
  // Si no está presente: obtener lista de reseñas reportadas
  @IsNumber()
  @IsOptional()
  serviceReviewId?: number;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'page must be greater than 0' })
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'limit must be greater than 0' })
  limit?: number;

  // Solo usado cuando NO hay serviceReviewId (lista de reseñas reportadas)
  @IsOptional()
  @IsEnum(OrderByServiceReviewReport)
  orderBy?: OrderByServiceReviewReport;
}
