import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/common/services/users.service';
import { GetCommentReportsDetailDto } from '../../dtos/get-comment-reports-detail.dto';
import { CommentReportsService } from '../comment-reports.service';

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetCommentReportsResponseDto {
  comment: {
    id: number;
    content: string;
    userId: number;
    publicationId: number;
    isActive: boolean;
    createdAt: Date;
  } | null;
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
export class GetCommentReportsUseCase {
  constructor(
    private readonly commentReportsService: CommentReportsService,
    private readonly usersService: UsersService,
  ) {}

  async execute(
    getCommentReportsDto: GetCommentReportsDetailDto,
  ): Promise<GetCommentReportsResponseDto> {
    const { page = 1, limit = 10, commentId } = getCommentReportsDto;

    // Obtener reportes del comentario con paginación
    const [reports, total] = await this.commentReportsService.getCommentReports(
      commentId,
      page,
      limit,
    );

    // Extraer información del comentario del primer reporte (si existe)
    const commentInfo =
      reports.length > 0 && reports[0].comment
        ? {
            id: reports[0].comment.id,
            content: reports[0].comment.content,
            userId: reports[0].comment.userId,
            publicationId: reports[0].comment.publicationId,
            isActive: reports[0].comment.isActive,
            createdAt: reports[0].comment.createdAt,
          }
        : null;

    // Obtener información de los usuarios que reportaron
    const reporterIds = reports.map((report) => report.reporterId);
    const uniqueReporterIds = [...new Set(reporterIds)];
    const reportersInfo =
      await this.usersService.getUsersByIds(uniqueReporterIds);

    // Crear un mapa de reporterId a nombre
    const reporterNameMap = new Map<number, string>();
    reportersInfo.forEach((reporter) => {
      const fullName = `${reporter.name} ${reporter.lastName}`.trim();
      reporterNameMap.set(reporter.id, fullName || `Usuario ${reporter.id}`);
    });

    // Enriquecer los reportes con el nombre del reportero
    const enrichedReports = reports.map((report) => ({
      id: report.id,
      reporterName:
        reporterNameMap.get(report.reporterId) ||
        `Usuario ${report.reporterId}`,
      reason: report.reason,
      otherReason: report.otherReason,
      description: report.description,
      createdAt: report.createdAt,
    }));

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    return {
      comment: commentInfo,
      reports: enrichedReports,
      pagination,
    };
  }
}
