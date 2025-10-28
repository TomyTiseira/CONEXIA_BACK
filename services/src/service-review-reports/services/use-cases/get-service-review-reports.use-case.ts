import { Injectable } from '@nestjs/common';
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
    const params = {
      ...dto,
      page: dto.page || 1,
      limit: dto.limit || 10,
    };

    // Obtener reportes de la reseña con paginación
    const [reports, total] =
      await this.serviceReviewReportRepository.findReportsByServiceReview(
        params.serviceReviewId,
        params.page,
        params.limit,
      );

    // Obtener información de usuarios para cada reporte
    const userIds = Array.from(
      new Set(reports.map((report) => report.reporterId)),
    );
    const users = await this.usersClient.getUsersByIds(userIds);
    const usersMap = new Map(users.map((user) => [user.id, user]));

    // Transformar datos con información de usuarios
    const transformedReports: ServiceReviewReportResponseDto[] = reports.map(
      (report) => {
        const user = usersMap.get(report.reporterId);
        return {
          id: report.id,
          reason: report.reason,
          otherReason: report.otherReason,
          description: report.description,
          createdAt: report.createdAt,
          serviceReviewId: report.serviceReviewId,
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
      },
    );

    // Calcular información de paginación
    const pagination = calculatePagination(total, params);

    return {
      reports: transformedReports,
      pagination,
    };
  }
}
