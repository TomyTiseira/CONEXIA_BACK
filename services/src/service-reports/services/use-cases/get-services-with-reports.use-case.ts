import { Injectable } from '@nestjs/common';
import { ServiceReportInternalServerErrorException } from '../../../common/exceptions/service-report.exceptions';
import {
  GetServiceReportsListDto,
  OrderByServiceReport,
} from '../../dtos/get-service-reports-list.dto';
import { ServiceReportsService } from '../service-reports.service';

export interface ServiceWithReportsResponseDto {
  serviceId: number;
  serviceTitle: string;
  reportCount: number;
  lastReportDate: Date;
  status: string;
  deletedAt: Date | null;
}

export interface ServiceWithReportsPaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function calculatePagination(
  total: number,
  { page, limit }: { page: number; limit: number },
): ServiceWithReportsPaginationInfo {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export interface GetServicesWithReportsResponseDto {
  services: ServiceWithReportsResponseDto[];
  pagination: ServiceWithReportsPaginationInfo;
}

@Injectable()
export class GetServicesWithReportsUseCase {
  constructor(private readonly serviceReportsService: ServiceReportsService) {}

  async execute(
    getServiceReportsListDto: GetServiceReportsListDto,
  ): Promise<GetServicesWithReportsResponseDto> {
    try {
      const {
        page = 1,
        limit = 10,
        orderBy = OrderByServiceReport.REPORT_COUNT,
      } = getServiceReportsListDto;

      // Obtener servicios con conteo de reportes
      const [services, total] =
        await this.serviceReportsService.getServicesWithReportCounts(
          orderBy,
          page,
          limit,
        );

      // Calcular información de paginación
      const pagination = calculatePagination(total, { page, limit });

      return {
        services,
        pagination,
      };
    } catch (error) {
      // Si ya es una RpcException, la relanzamos
      if (error instanceof Error && 'status' in error) {
        throw error;
      }

      throw new ServiceReportInternalServerErrorException(
        'Error interno al obtener los servicios con reportes',
      );
    }
  }
}
