import { Injectable } from '@nestjs/common';
import { GetPublicationReportsDto } from '../../dtos/get-publication-reports.dto';
import { PublicationReportsService } from '../publication-reports.service';

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetPublicationsWithReportsResponseDto {
  publications: any[];
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
export class GetPublicationsWithReportsUseCase {
  constructor(
    private readonly publicationReportsService: PublicationReportsService,
  ) {}

  async execute(
    getReportsDto: GetPublicationReportsDto,
  ): Promise<GetPublicationsWithReportsResponseDto> {
    const { page = 1, limit = 10 } = getReportsDto;

    // Obtener publicaciones con reportes con paginación
    const [publications, total] =
      await this.publicationReportsService.getPublicationsWithReports(
        getReportsDto,
      );

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    return {
      publications,
      pagination,
    };
  }
}
