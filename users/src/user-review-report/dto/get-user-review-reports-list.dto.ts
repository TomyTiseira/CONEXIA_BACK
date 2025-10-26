import { OrderByUserReviewReport } from '../enums/orderby-user-review-report.enum';

export class GetUserReviewReportsListDto {
  orderBy?: OrderByUserReviewReport = OrderByUserReviewReport.REPORT_COUNT;
  page?: number = 1;
  limit?: number = 10;
}
