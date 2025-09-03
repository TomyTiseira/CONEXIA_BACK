import { Injectable } from '@nestjs/common';
import { GetPublicationCommentsDto } from '../../../dto/get-publication-comments.dto';
import { CommentRepository } from '../../../repositories/comment.repository';
import { PublicationRepository } from '../../../repositories/publication.repository';
import { CommentsPaginatedDto } from 'src/publications/response/comments-paginated.dto';

@Injectable()
export class GetPublicationCommentsUseCase {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly publicationRepository: PublicationRepository,
  ) {}

  async execute(
    data: GetPublicationCommentsDto,
  ): Promise<CommentsPaginatedDto> {
    const page = data.page || 1;
    const limit = data.limit || 10;

    const [comments, total] =
      await this.commentRepository.findActiveCommentsByPublicationId(
        data.publicationId,
        page,
        limit,
      );

    const totalPages = Math.ceil(total / limit);

    return {
      comments,
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
