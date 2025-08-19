import { OrderByReport } from '../enum/orderby-report.enum';

export class GetReportsDto {
  orderBy?: OrderByReport = OrderByReport.REPORT_COUNT;
  page?: number = 1;
  limit?: number = 10;
}
