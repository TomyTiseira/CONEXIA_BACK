import { Injectable } from '@nestjs/common';
import { GetPublicationReactionsDto } from '../../../dto/get-publication-reactions.dto';
import { ReactionRepository } from '../../../repositories/reaction.repository';
import { ReactionSummaryDto } from 'src/publications/response/reaction-summary.dto';
import { ReactionsPaginatedDto } from 'src/publications/response/reactions-paginated.dto';

@Injectable()
export class GetPublicationReactionsUseCase {
  constructor(private readonly reactionRepository: ReactionRepository) {}

  async execute(
    data: GetPublicationReactionsDto,
  ): Promise<ReactionsPaginatedDto> {
    const page = data.page || 1;
    const limit = data.limit || 10;

    // Obtener reacciones paginadas
    const [reactions, total] =
      await this.reactionRepository.findActiveReactionsByPublicationId(
        data.publicationId,
        page,
        limit,
      );

    // Obtener el resumen de reacciones por tipo
    const reactionCounts =
      await this.reactionRepository.countReactionsByTypeAndPublicationId(
        data.publicationId,
      );

    const summary: ReactionSummaryDto = {
      total: reactionCounts.reduce((sum, item) => sum + Number(item.count), 0),
      types: reactionCounts.map((item) => ({
        type: item.type,
        count: Number(item.count),
      })),
    };

    const totalPages = Math.ceil(total / limit);

    return {
      reactions,
      summary,
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
