import { Injectable } from '@nestjs/common';
import { ServiceReportInternalServerErrorException } from '../../../common/exceptions/service-report.exceptions';
import { UsersClientService } from '../../../common/services/users-client.service';
import { GetServiceReportsDto } from '../../dtos/get-service-reports.dto';
import { ServiceReportsService } from '../service-reports.service';

export interface ServiceReportResponseDto {
  id: number;
  reason: string;
  otherReason?: string;
  description: string;
  createdAt: Date;
  serviceId: number;
  reporterId: number;
  reporter: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ServiceReportPaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function calculatePagination(total: number, { page, limit }: { page: number; limit: number }): ServiceReportPaginationInfo {
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

function transformServiceReportsWithUsers(
  reports: any[],
  users: any[],
): ServiceReportResponseDto[] {
  return reports.map((report) => {
    const user = users.find((u) => u.id === report.reporterId);
    return {
      id: report.id,
      reason: report.reason,
      otherReason: report.otherReason,
      description: report.description,
      createdAt: report.createdAt,
      serviceId: report.serviceId,
      reporterId: report.reporterId,
      reporter: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        : {
            id: report.reporterId,
            email: 'Usuario no encontrado',
            firstName: 'N/A',
            lastName: 'N/A',
          },
    };
  });
}

export interface GetServiceReportsResponseDto {
  reports: ServiceReportResponseDto[];
  pagination: ServiceReportPaginationInfo;
}

@Injectable()
export class GetServiceReportsUseCase {
  constructor(
    private readonly serviceReportsService: ServiceReportsService,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(
    getServiceReportsDto: GetServiceReportsDto,
  ): Promise<GetServiceReportsResponseDto> {
    try {
      const { page = 1, limit = 10, serviceId } = getServiceReportsDto;

      // Obtener reportes del servicio con paginación
      const [reports, total] = await this.serviceReportsService.getServiceReports(
        serviceId,
        page,
        limit,
      );

      // Obtener información de usuarios para cada reporte
      const userIds = [...new Set(reports.map((report) => report.reporterId))] as number[];
      const users = await this.usersClientService.getUsersByIds(userIds);

      const transformedReports = transformServiceReportsWithUsers(reports, users);

      // Calcular información de paginación
      const pagination = calculatePagination(total, { page, limit });

      return {
        reports: transformedReports,
        pagination,
      };
    } catch (error) {
      // Si ya es una RpcException, la relanzamos
      if (error instanceof Error && 'status' in error) {
        throw error;
      }
      
      throw new ServiceReportInternalServerErrorException(
        'Error interno al obtener los reportes del servicio'
      );
    }
  }
}
