import { Injectable } from '@nestjs/common';
import { OrderByUserReviewReport } from 'src/user-review-report/enums/orderby-user-review-report.enum';
import { UsersService } from '../../../users/service/users.service';
import { GetUserReviewReportsListDto } from '../../dto/get-user-review-reports-list.dto';
import { UserReviewReportsService } from '../user-review-reports.service';

export interface UserReviewWithReportsResponseDto {
  userReviewId: number;
  reviewedUserId: number;
  reviewerUserId: number;
  relationship: string;
  description: string;
  reportCount: number;
  lastReportDate: Date;
  reviewCreatedAt: Date;
  reviewedUser: {
    id: number;
    email: string;
    name: string;
    lastName: string;
  };
  reviewerUser: {
    id: number;
    email: string;
    name: string;
    lastName: string;
  };
}

export interface UserReviewWithReportsPaginationInfo {
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
): UserReviewWithReportsPaginationInfo {
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

export interface GetUserReviewsWithReportsResponseDto {
  userReviews: UserReviewWithReportsResponseDto[];
  pagination: UserReviewWithReportsPaginationInfo;
}

@Injectable()
export class GetUserReviewsWithReportsUseCase {
  constructor(
    private readonly userReviewReportsService: UserReviewReportsService,
    private readonly usersService: UsersService,
  ) {}

  async execute(
    getUserReviewReportsListDto: GetUserReviewReportsListDto,
  ): Promise<GetUserReviewsWithReportsResponseDto> {
    const {
      page = 1,
      limit = 10,
      orderBy = OrderByUserReviewReport.REPORT_COUNT,
    } = getUserReviewReportsListDto;

    // Obtener reseñas con conteo de reportes
    const [userReviews, total] =
      await this.userReviewReportsService.getUserReviewsWithReportCounts({
        orderBy,
        page,
        limit,
      });

    // Obtener IDs únicos de usuarios
    const reviewedUserIds = userReviews.map((review) => review.reviewedUserId);
    const reviewerUserIds = userReviews.map((review) => review.reviewerUserId);
    const allUserIds = [
      ...new Set([
        ...(reviewedUserIds as number[]),
        ...(reviewerUserIds as number[]),
      ]),
    ] as number[];

    // Obtener información de usuarios
    const users = await this.usersService.findUsersByIds(allUserIds);
    const usersMap = new Map(users.map((user) => [user.id, user]));

    // Transformar datos con información de usuarios
    const transformedUserReviews: UserReviewWithReportsResponseDto[] =
      userReviews.map((review) => {
        const reviewedUser = usersMap.get(review.reviewedUserId);
        const reviewerUser = usersMap.get(review.reviewerUserId);

        return {
          userReviewId: review.userReviewId,
          reviewedUserId: review.reviewedUserId,
          reviewerUserId: review.reviewerUserId,
          relationship: review.relationship,
          description: review.description,
          reportCount: review.reportCount,
          lastReportDate: review.lastReportDate,
          reviewCreatedAt: review.reviewCreatedAt,
          reviewedUser: reviewedUser
            ? {
                id: reviewedUser.id,
                email: reviewedUser.email,
                name: reviewedUser.profile?.name || '',
                lastName: reviewedUser.profile?.lastName || '',
              }
            : {
                id: review.reviewedUserId,
                email: '',
                name: '',
                lastName: '',
              },
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
        };
      });

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    return {
      userReviews: transformedUserReviews,
      pagination,
    };
  }
}
