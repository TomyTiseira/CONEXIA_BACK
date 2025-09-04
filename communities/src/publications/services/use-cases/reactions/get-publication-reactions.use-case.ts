import { Injectable } from '@nestjs/common';
import { EnhancedReactionsPaginatedDto } from 'src/publications/response/enhanced-reactions-paginated.dto';
import { GetPublicationReactionsDto } from '../../../dto/get-publication-reactions.dto';
import { ReactionRepository } from '../../../repositories/reaction.repository';
import { UserInfoService } from '../../user-info.service';

@Injectable()
export class GetPublicationReactionsUseCase {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    private readonly userInfoService: UserInfoService,
  ) {}

  async execute(
    data: GetPublicationReactionsDto,
  ): Promise<EnhancedReactionsPaginatedDto> {
    const page = data.page || 1;
    const limit = data.limit || 10;

    // Obtener reacciones paginadas, posiblemente filtrando por tipo
    const [reactions, total] =
      await this.reactionRepository.findActiveReactionsByPublicationId(
        data.publicationId,
        page,
        limit,
        data.type,
      );

    // Obtener el resumen de reacciones por tipo
    const reactionCounts =
      await this.reactionRepository.countReactionsByTypeAndPublicationId(
        data.publicationId,
      );

    // Crear el resumen de reacciones con emojis
    const reactionsSummary = reactionCounts.map((item) => ({
      type: item.type,
      count: Number(item.count),
      emoji: this.getEmojiForReactionType(item.type),
    }));

    // Obtener información de usuarios para las reacciones
    const userIds = reactions.map((reaction) => reaction.userId);
    const userInfoMap = await this.userInfoService.getUserInfoByIds(userIds);

    // Enriquecer las reacciones con información de usuario
    const enhancedReactions = reactions.map((reaction) => ({
      id: reaction.id,
      type: reaction.type,
      userId: reaction.userId,
      user: userInfoMap[reaction.userId],
      createdAt: reaction.createdAt,
    }));

    const totalPages = Math.ceil(total / limit);
    const reactionsTotal = reactionCounts.reduce(
      (sum, item) => sum + Number(item.count),
      0,
    );

    return {
      reactionsCount: reactionsTotal,
      reactionsSummary,
      reactions: enhancedReactions,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  }

  /**
   * Devuelve el emoji correspondiente a un tipo de reacción
   */
  private getEmojiForReactionType(type: string): string {
    const emojiMap: Record<string, string> = {
      like: '👍',
      love: '❤️',
      support: '🤝',
      celebrate: '🎉',
      insightful: '💡',
    };
    return emojiMap[type] || '👍';
  }
}
