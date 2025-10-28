import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { OrderByServiceReviewReport } from '../enums/orderby-service-review-report.enum';

export class GetServiceReviewsWithReportsDto {
  @IsOptional()
  @IsEnum(OrderByServiceReviewReport, { message: 'Invalid orderBy value' })
  orderBy?: OrderByServiceReviewReport;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'page must be greater than 0' })
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'limit must be greater than 0' })
  limit?: number;
}
