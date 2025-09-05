import { Injectable } from '@nestjs/common';
import { EnhancedCommentsPaginatedDto } from 'src/publications/response/enhanced-comments-paginated.dto';
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
      throw new Error('Publication not found or access denied');
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

    // Enriquecer los comentarios con información de usuario
    const enhancedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      user: userInfoMap[comment.userId],
      publicationId: comment.publicationId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
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
