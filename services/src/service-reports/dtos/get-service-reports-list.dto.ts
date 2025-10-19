export enum OrderByServiceReport {
  REPORT_COUNT = 'reportCount',
  LAST_REPORT_DATE = 'lastReportDate',
}

export class GetServiceReportsListDto {
  orderBy?: OrderByServiceReport = OrderByServiceReport.REPORT_COUNT;
  page?: number = 1;
  limit?: number = 10;
}
