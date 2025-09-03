import { Injectable } from '@nestjs/common';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { GetPublicationsDto } from '../../dto/get-publications.dto';
import { CommentRepository } from '../../repositories/comment.repository';
import { PublicationRepository } from '../../repositories/publication.repository';
import { ReactionRepository } from '../../repositories/reaction.repository';
import { PublicationWithOwnerDto } from '../../response/publication-with-owner.dto';
import { PublicationsPaginatedDto } from '../../response/publications-paginated.dto';
import { OwnerHelperService } from '../helpers/owner-helper.service';

@Injectable()
export class GetPublicationsUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly commentRepository: CommentRepository,
    private readonly reactionRepository: ReactionRepository,
    private readonly ownerHelperService: OwnerHelperService,
  ) {}

  async execute(data: GetPublicationsDto): Promise<PublicationsPaginatedDto> {
    // Configurar parámetros de paginación
    const params = {
      page: data.page || 1,
      limit: data.limit || 10,
    };

    // Obtener publicaciones con paginación
    const [publications, total] =
      await this.publicationRepository.findActivePublicationsPaginated(
        params.page,
        params.limit,
      );

    // Obtener información de comentarios y reacciones para cada publicación
    const enrichedPublications = await Promise.all(
      publications.map(async (publication) => {
        // Obtener conteo y últimos comentarios
        const [comments, commentsTotal] =
          await this.commentRepository.findActiveCommentsByPublicationId(
            publication.id,
            1,
            3, // Obtener solo los últimos 3 comentarios
          );

        // Obtener conteo y resumen de reacciones
        const [reactions, reactionsTotal] =
          await this.reactionRepository.findActiveReactionsByPublicationId(
            publication.id,
            1,
            10,
          );

        // Calcular resumen de reacciones por tipo
        const reactionTypes = reactions.reduce(
          (acc, reaction) => {
            if (reaction.type) {
              acc[reaction.type] = (acc[reaction.type] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>,
        );

        const reactionsSummary = Object.entries(reactionTypes).map(
          ([type, count]) => ({
            type,
            count: count,
          }),
        );

        // Verificar si el usuario actual tiene alguna reacción
        let currentUserReaction: { id: number; type: string } | null = null;
        if (data.currentUserId) {
          const foundReaction = reactions.find(
            (r) => r.userId === data.currentUserId,
          );
          if (foundReaction) {
            currentUserReaction = {
              id: foundReaction.id,
              type: foundReaction.type,
            };
          }
        }

        return {
          ...publication,
          commentsCount: commentsTotal,
          latestComments: comments,
          reactionsCount: reactionsTotal,
          reactionsSummary,
          userReaction: currentUserReaction,
        };
      }),
    );

    // Enriquecer publicaciones con información del owner
    const fullyEnrichedPublications =
      (await this.ownerHelperService.enrichPublicationsWithOwners(
        enrichedPublications,
        data.currentUserId,
      )) as PublicationWithOwnerDto[];

    // Calcular información de paginación
    const pagination = calculatePagination(total, params);

    return {
      publications: fullyEnrichedPublications,
      pagination,
    };
  }
}
