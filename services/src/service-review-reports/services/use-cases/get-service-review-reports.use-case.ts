import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UsersClientService } from '../../../common/services/users-client.service';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { GetServiceReviewReportsDto } from '../../dto/get-service-review-reports.dto';
import { ServiceReviewReportRepository } from '../../repositories/service-review-report.repository';

export interface ServiceReviewReportResponseDto {
  id: number;
  reason: string;
  otherReason?: string;
  description: string;
  createdAt: Date;
  serviceReviewId: number;
  serviceId: number; // ID del servicio al que pertenece la reseña
  reporterId: number;
  reporter: {
    id: number;
    email: string;
    name: string;
    lastName: string;
  };
}

@Injectable()
export class GetServiceReviewReportsUseCase {
  constructor(
    private readonly serviceReviewReportRepository: ServiceReviewReportRepository,
    private readonly usersClient: UsersClientService,
  ) {}

  async execute(dto: GetServiceReviewReportsDto) {
    try {
      // Validar que serviceReviewId esté presente
      if (!dto.serviceReviewId) {
        throw new RpcException({
          status: 400,
          message: 'serviceReviewId is required',
          error: 'Bad Request',
        });
      }

      const params = {
        ...dto,
        page: dto.page || 1,
        limit: dto.limit || 10,
      };

      // Obtener reportes de la reseña con paginación
      const [reports, total] =
        await this.serviceReviewReportRepository.findReportsByServiceReview(
          dto.serviceReviewId, // Ahora TypeScript sabe que no es undefined
          params.page,
          params.limit,
        );

      // Si no hay reportes, retornar estructura vacía
      if (reports.length === 0) {
        const pagination = calculatePagination(0, params);
        return {
          reports: [],
          pagination,
        };
      }

      // Obtener información de usuarios para cada reporte
      const userIds = Array.from(
        new Set(reports.map((report) => report.reporterId)),
      );
      const users = await this.usersClient.getUsersByIds(userIds);
      const usersMap = new Map(users.map((user) => [user.id, user]));

      // Transformar datos con información de usuarios
      // Filtrar reportes que tengan serviceReview válido (no eliminado)
      const transformedReports: ServiceReviewReportResponseDto[] = reports
        .filter(report => report.serviceReview != null) // Filtrar reportes huérfanos
        .map((report) => {
          const user = usersMap.get(report.reporterId);
          return {
            id: report.id,
            reason: report.reason,
            otherReason: report.otherReason,
            description: report.description,
            createdAt: report.createdAt,
            serviceReviewId: report.serviceReviewId,
            serviceId: report.serviceReview?.serviceId || 0, // ID del servicio
            reporterId: report.reporterId,
            reporter: user
              ? {
                  id: user.id,
                  email: user.email,
                  name: user.profile?.name || '',
                  lastName: user.profile?.lastName || '',
                }
              : {
                  id: report.reporterId,
                  email: '',
                  name: '',
                  lastName: '',
                },
          };
        });

      // Calcular información de paginación con el total filtrado
      const pagination = calculatePagination(transformedReports.length, params);

      return {
        reports: transformedReports,
        pagination,
      };
    } catch (error) {
      // Si ya es una RpcException, la relanzamos
      if (error instanceof RpcException) {
        throw error;
      }

      // Error genérico
      throw new RpcException({
        status: 500,
        message: 'An error occurred while fetching service review reports',
        error: 'Internal Server Error',
      });
    }
  }
}
