import { Injectable } from '@nestjs/common';
import {
  calculatePagination,
  PaginationInfo,
} from '../../../common/utils/pagination.utils';
import { GetReportsDto } from '../../dtos/get-reports.dto';
import { ReportsService } from '../reports.service';

export interface GetProjectsWithReportsResponseDto {
  projects: any[];
  pagination: PaginationInfo;
}

@Injectable()
export class GetProjectsWithReportsUseCase {
  constructor(private readonly reportsService: ReportsService) {}

  async execute(
    getReportsDto: GetReportsDto,
  ): Promise<GetProjectsWithReportsResponseDto> {
    const { page = 1, limit = 10 } = getReportsDto;

    // Obtener proyectos con reportes con paginación
    const [projects, total] =
      await this.reportsService.getProjectsWithReports(getReportsDto);

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    return {
      projects,
      pagination,
    };
  }
}
