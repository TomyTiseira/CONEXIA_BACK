import { Injectable } from '@nestjs/common';
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

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    return {
      reports,
      pagination,
    };
  }
}
