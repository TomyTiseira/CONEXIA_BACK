import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/common/services/users.service';
import { GetPublicationReportsDetailDto } from '../../dtos/get-publication-reports-detail.dto';
import { PublicationReportsService } from '../publication-reports.service';

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetPublicationReportsResponseDto {
  reports: any[];
  pagination: PaginationInfo;
}

function calculatePagination(
  total: number,
  { page, limit }: { page: number; limit: number },
): PaginationInfo {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

@Injectable()
export class GetPublicationReportsUseCase {
  constructor(
    private readonly publicationReportsService: PublicationReportsService,
    private readonly usersService: UsersService,
  ) {}

  async execute(
    getPublicationReportsDto: GetPublicationReportsDetailDto,
  ): Promise<GetPublicationReportsResponseDto> {
    const { page = 1, limit = 10, publicationId } = getPublicationReportsDto;

    // Obtener reportes de la publicación con paginación
    const [reports, total] =
      await this.publicationReportsService.getPublicationReports(
        publicationId,
        page,
        limit,
      );

    // Obtener información de los usuarios reportantes
    const reporterIds = [...new Set(reports.map((r) => r.reporterId))].filter(
      Boolean,
    );
    const reporters =
      reporterIds.length > 0
        ? await this.usersService.getUsersByIds(reporterIds)
        : [];
    const reporterMap = new Map(reporters.map((u) => [u.id, u]));

    // Enriquecer reportes con nombre y apellido del reportante
    const enrichedReports = reports.map((report) => {
      const reporter = reporterMap.get(report.reporterId);
      return {
        ...report,
        reporterName: reporter?.name ?? null,
        reporterLastName: reporter?.lastName ?? null,
      };
    });

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    return {
      reports: enrichedReports,
      pagination,
    };
  }
}
