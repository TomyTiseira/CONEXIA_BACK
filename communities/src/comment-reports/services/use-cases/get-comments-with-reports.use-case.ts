import { Injectable } from '@nestjs/common';
import { GetCommentReportsDto } from '../../dtos/get-comment-reports.dto';
import { CommentReportsService } from '../comment-reports.service';

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetCommentsWithReportsResponseDto {
  comments: any[];
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
export class GetCommentsWithReportsUseCase {
  constructor(private readonly commentReportsService: CommentReportsService) {}

  async execute(
    getReportsDto: GetCommentReportsDto,
  ): Promise<GetCommentsWithReportsResponseDto> {
    const { page = 1, limit = 10 } = getReportsDto;

    // Obtener comentarios con reportes con paginación
    const [comments, total] =
      await this.commentReportsService.getCommentsWithReports(getReportsDto);

    // Transformar comentarios para incluir publicationId en el nivel superior
    const transformedComments = comments.map((comment) => ({
      commentId: comment.commentId,
      commentContent: comment.commentContent,
      reportCount: comment.reportCount,
      lastReportDate: comment.lastReportDate,
      isActive: comment.isActive,
      deletedAt: comment.deletedAt,
      publicationId: comment.comment?.publicationId || null,
      userId: comment.comment?.userId || null,
    }));

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    return {
      comments: transformedComments,
      pagination,
    };
  }
}
