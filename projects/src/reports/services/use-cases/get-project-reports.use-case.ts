import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import {
  calculatePagination,
  PaginationInfo,
} from '../../../common/utils/pagination.utils';
import { GetProjectReportsDto } from '../../dtos/get-project-reports.dto';
import { ReportResponseDto } from '../../response/report-response.dto';
import { transformReportsWithUsers } from '../../utils/report-transform.utils';
import { ReportsService } from '../reports.service';

export interface GetProjectReportsResponseDto {
  reports: ReportResponseDto[];
  pagination: PaginationInfo;
}

@Injectable()
export class GetProjectReportsUseCase {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(
    getProjectReportsDto: GetProjectReportsDto,
  ): Promise<GetProjectReportsResponseDto> {
    const { page = 1, limit = 10, projectId } = getProjectReportsDto;

    // Obtener reportes del proyecto con paginación
    const [reports, total] = await this.reportsService.getProjectReports(
      projectId,
      page,
      limit,
    );

    // Obtener información de usuarios para cada reporte
    const userIds = [...new Set(reports.map((report) => report.reporterId))];
    const users = await this.usersClientService.getUsersByIds(userIds);

    const transformedReports = transformReportsWithUsers(reports, users);

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    return {
      reports: transformedReports,
      pagination,
    };
  }
}
