import { Injectable } from '@nestjs/common';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { PublicationReportRepository } from '../../../publication-reports/repositories/publication-report.repository';
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
    private readonly publicationReportRepository: PublicationReportRepository,
  ) {}

  async execute(data: GetPublicationsDto): Promise<PublicationsPaginatedDto> {
    // Configurar parámetros de paginación
    const params = {
      page: data.page || 1,
      limit: data.limit || 10,
    };

    // Obtener publicaciones con paginación y filtrado por privacidad
    const [publications, total] =
      await this.publicationRepository.findActivePublicationsPaginatedWithFriendsFilter(
        params.page,
        params.limit,
        data.currentUserId,
      );

    // Verificar si el usuario reportó cada publicación (batch query)
    const hasReportedMap = new Map<number, boolean>();
    if (data.currentUserId) {
      const reportPromises = publications.map(async (pub) => {
        // Si es el dueño, no puede reportar su propia publicación
        if (data.currentUserId === pub.userId) {
          return { publicationId: pub.id, hasReported: false };
        }
        const report = await this.publicationReportRepository.findByPublicationAndReporter(
          pub.id,
          data.currentUserId,
        );
        return { publicationId: pub.id, hasReported: report !== null };
      });
      const results = await Promise.all(reportPromises);
      results.forEach(({ publicationId, hasReported }) => {
        hasReportedMap.set(publicationId, hasReported);
      });
    }

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

        const hasReported = hasReportedMap.get(publication.id) || false;

        return {
          ...publication,
          commentsCount: commentsTotal,
          latestComments: comments,
          reactionsCount: reactionsTotal,
          reactionsSummary,
          userReaction: currentUserReaction,
          hasReported,
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
