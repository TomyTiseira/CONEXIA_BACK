import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { OrderByServiceReviewReport } from '../../enums/orderby-service-review-report.enum';
import { ServiceReviewReportRepository } from '../../repositories/service-review-report.repository';

export interface GetServiceReviewsWithReportsParams {
  page: number;
  limit: number;
  orderBy?: OrderByServiceReviewReport;
}

export interface ServiceReviewWithReportsResponseDto {
  serviceReviewId: number;
  serviceId: number;
  reviewerUserId: number;
  serviceOwnerUserId: number;
  rating: number;
  comment: string;
  reportCount: number;
  lastReportDate: Date;
  reviewCreatedAt: Date;
  reviewerUser: {
    id: number;
    email: string;
    name: string;
    lastName: string;
  };
  serviceOwnerUser: {
    id: number;
    email: string;
    name: string;
    lastName: string;
  };
}

@Injectable()
export class GetServiceReviewsWithReportsUseCase {
  constructor(
    private readonly serviceReviewReportRepository: ServiceReviewReportRepository,
    private readonly usersClient: UsersClientService,
  ) {}

  async execute(dto: GetServiceReviewsWithReportsParams) {
    const params = {
      orderBy: dto.orderBy || OrderByServiceReviewReport.REPORT_COUNT,
      page: dto.page || 1,
      limit: dto.limit || 10,
    };

    // Obtener reseñas con conteo de reportes
    const [serviceReviews, total] =
      await this.serviceReviewReportRepository.getServiceReviewsWithReportCounts(
        params,
      );

    // Obtener IDs únicos de usuarios (reviewers y service owners)
    const reviewerUserIds = serviceReviews.map(
      (review) => review.reviewerUserId,
    );
    const serviceOwnerUserIds = serviceReviews.map(
      (review) => review.serviceOwnerUserId,
    );
    const allUserIds = Array.from(
      new Set([...reviewerUserIds, ...serviceOwnerUserIds]),
    );

    // Obtener información de usuarios
    const users = await this.usersClient.getUsersByIds(allUserIds);
    const usersMap = new Map(users.map((user) => [user.id, user]));

    // Transformar datos con información de usuarios
    const transformedServiceReviews: ServiceReviewWithReportsResponseDto[] =
      serviceReviews.map((review) => {
        const reviewerUser = usersMap.get(review.reviewerUserId);
        const serviceOwnerUser = usersMap.get(review.serviceOwnerUserId);

        return {
          serviceReviewId: review.serviceReviewId,
          serviceId: review.serviceId,
          reviewerUserId: review.reviewerUserId,
          serviceOwnerUserId: review.serviceOwnerUserId,
          rating: review.rating,
          comment: review.comment,
          reportCount: review.reportCount,
          lastReportDate: review.lastReportDate,
          reviewCreatedAt: review.reviewCreatedAt,
          reviewerUser: reviewerUser
            ? {
                id: reviewerUser.id,
                email: reviewerUser.email,
                name: reviewerUser.profile?.name || '',
                lastName: reviewerUser.profile?.lastName || '',
              }
            : {
                id: review.reviewerUserId,
                email: '',
                name: '',
                lastName: '',
              },
          serviceOwnerUser: serviceOwnerUser
            ? {
                id: serviceOwnerUser.id,
                email: serviceOwnerUser.email,
                name: serviceOwnerUser.profile?.name || '',
                lastName: serviceOwnerUser.profile?.lastName || '',
              }
            : {
                id: review.serviceOwnerUserId,
                email: '',
                name: '',
                lastName: '',
              },
        };
      });

    // Calcular información de paginación
    const pagination = calculatePagination(total, params);

    return {
      serviceReviews: transformedServiceReviews,
      pagination,
    };
  }
}
