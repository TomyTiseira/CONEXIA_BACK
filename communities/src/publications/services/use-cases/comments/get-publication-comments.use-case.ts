import { Injectable } from '@nestjs/common';
import { PublicationNotFoundException } from 'src/common/exceptions/publications.exceptions';
import { EnhancedCommentsPaginatedDto } from 'src/publications/response/enhanced-comments-paginated.dto';
import { CommentReportRepository } from '../../../../comment-reports/repositories/comment-report.repository';
import { CommentSortType } from '../../../dto/comment-sort-type.enum';
import { GetPublicationCommentsDto } from '../../../dto/get-publication-comments.dto';
import { CommentRepository } from '../../../repositories/comment.repository';
import { PublicationRepository } from '../../../repositories/publication.repository';
import { UserInfoService } from '../../user-info.service';

@Injectable()
export class GetPublicationCommentsUseCase {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly publicationRepository: PublicationRepository,
    private readonly userInfoService: UserInfoService,
    private readonly commentReportRepository: CommentReportRepository,
  ) {}

  async execute(
    data: GetPublicationCommentsDto,
  ): Promise<EnhancedCommentsPaginatedDto> {
    const page = data.page || 1;
    const limit = data.limit || 10;
    const sortBy =
      (data as any).sort === CommentSortType.RELEVANCE
        ? CommentSortType.RELEVANCE
        : CommentSortType.RECENT;

    // Primero, verificar que la publicación existe y el usuario tiene acceso a ella
    const publication =
      await this.publicationRepository.findActivePublicationById(
        data.publicationId,
        data.currentUserId,
      );

    if (!publication) {
      throw new PublicationNotFoundException(data.publicationId);
    }

    // Obtener los comentarios con el ordenamiento adecuado
    const [comments, total] =
      await this.commentRepository.findActiveCommentsByPublicationId(
        data.publicationId,
        page,
        limit,
        sortBy,
      );

    // Obtener información de usuarios para los comentarios
    const userIds = comments.map((comment) => comment.userId);
    const userInfoMap = await this.userInfoService.getUserInfoByIds(userIds);

    // Verificar si el usuario reportó cada comentario (batch query)
    const hasReportedMap = new Map<number, boolean>();
    if (data.currentUserId) {
      const reportPromises = comments.map(async (comment) => {
        // Si es el dueño del comentario, no puede reportarlo
        if (data.currentUserId === comment.userId) {
          return { commentId: comment.id, hasReported: false };
        }
        const report =
          await this.commentReportRepository.findByCommentAndReporter(
            comment.id,
            data.currentUserId!,
          );
        return { commentId: comment.id, hasReported: report !== null };
      });
      const results = await Promise.all(reportPromises);
      results.forEach(({ commentId, hasReported }) => {
        hasReportedMap.set(commentId, hasReported);
      });
    }

    // Enriquecer los comentarios con información de usuario y hasReported
    const enhancedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      user: userInfoMap[comment.userId],
      publicationId: comment.publicationId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      hasReported: hasReportedMap.get(comment.id) || false,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      comments: enhancedComments,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  }
}
