/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../users/service/users.service';
import { GetUserReviewReportsDto } from '../../dto/get-user-review-reports.dto';
import { UserReviewReportsService } from '../user-review-reports.service';

export interface UserReviewReportResponseDto {
  id: number;
  reason: string;
  otherReason?: string;
  description: string;
  createdAt: Date;
  userReviewId: number;
  reporterId: number;
  reviewedUserId: number;
  reporter: {
    id: number;
    email: string;
    name: string;
    lastName: string;
  };
}

export interface UserReviewReportPaginationInfo {
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
): UserReviewReportPaginationInfo {
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

function transformUserReviewReportsWithUsers(
  reports: any[],
  users: any[],
): UserReviewReportResponseDto[] {
  return reports.map((report) => {
    const user = users.find((u) => u.id === report.reporterId);
    return {
      id: report.id,
      reason: report.reason,
      otherReason: report.otherReason,
      description: report.description,
      createdAt: report.createdAt,
      userReviewId: report.userReviewId,
      reporterId: report.reporterId,
      reviewedUserId: report.userReview?.reviewedUserId || null,
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
}

export interface GetUserReviewReportsResponseDto {
  reports: UserReviewReportResponseDto[];
  pagination: UserReviewReportPaginationInfo;
}

@Injectable()
export class GetUserReviewReportsUseCase {
  constructor(
    private readonly userReviewReportsService: UserReviewReportsService,
    private readonly usersService: UsersService,
  ) {}

  async execute(
    getUserReviewReportsDto: GetUserReviewReportsDto,
  ): Promise<GetUserReviewReportsResponseDto> {
    const { page = 1, limit = 10, userReviewId } = getUserReviewReportsDto;

    // Obtener reportes de la reseña con paginación
    const [reports, total] =
      await this.userReviewReportsService.getUserReviewReports(
        userReviewId,
        page,
        limit,
      );

    // Obtener información de usuarios para cada reporte
    const userIds = [
      ...new Set(reports.map((report) => report.reporterId)),
    ] as number[];
    const users = await this.usersService.findUsersByIds(userIds);

    const transformedReports = transformUserReviewReportsWithUsers(
      reports,
      users,
    );

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    return {
      reports: transformedReports,
      pagination,
    };
  }
}
