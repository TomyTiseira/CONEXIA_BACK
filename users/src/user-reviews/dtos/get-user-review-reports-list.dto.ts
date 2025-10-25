export enum OrderByUserReviewReport {
  REPORT_COUNT = 'reportCount',
  LAST_REPORT_DATE = 'lastReportDate',
}

export class GetUserReviewReportsListDto {
  orderBy?: OrderByUserReviewReport = OrderByUserReviewReport.REPORT_COUNT;
  page?: number = 1;
  limit?: number = 10;
}
