import { Injectable } from '@nestjs/common';
import {
  calculatePagination,
  PaginationInfo,
} from 'src/common/utils/pagination.utils';
import { UserReviewReportRepository } from 'src/user-review-report/repositories/user-review-report.repository';
import { GetUserReviewsDto } from '../../dto/get-user-reviews.dto';
import {
  MappedUserReview,
  UserReviewMapper,
} from '../../mappers/user-review.mapper';
import { UserReviewRepository } from '../../repository/user-review.repository';

export interface GetUserReviewsResult {
  reviews: MappedUserReview[];
  pagination: PaginationInfo;
  hasReviewed: boolean; // Indica si el usuario actual ya hizo una reseña al usuario consultado
}

@Injectable()
export class GetUserReviewsUseCase {
  constructor(
    private readonly userReviewRepository: UserReviewRepository,
    private readonly userReviewReportRepository: UserReviewReportRepository,
  ) {}

  async execute(
    getUserReviewsDto: GetUserReviewsDto,
  ): Promise<GetUserReviewsResult> {
    const params = {
      ...getUserReviewsDto,
      page: getUserReviewsDto.page || 1,
      limit: getUserReviewsDto.limit || 10,
    };

    const [reviews, total] =
      await this.userReviewRepository.findByReviewedUserId(params);

    const pagination = calculatePagination(total, params);

    // Verificar si el usuario actual ya hizo una reseña al usuario consultado
    let hasReviewed = false;
    if (getUserReviewsDto.currentUserId) {
      // Si el usuario actual es el mismo que el usuario consultado, no puede hacer reseña a sí mismo
      if (getUserReviewsDto.currentUserId === getUserReviewsDto.userId) {
        hasReviewed = false;
      } else {
        const existingReview =
          await this.userReviewRepository.findByReviewerAndReviewed(
            getUserReviewsDto.currentUserId,
            getUserReviewsDto.userId,
          );
        hasReviewed = existingReview !== null;
      }
    }

    // Verificar si el usuario reportó cada reseña (batch query)
    const hasReportedMap = new Map<number, boolean>();
    console.log('[DEBUG] currentUserId:', getUserReviewsDto.currentUserId);
    console.log('[DEBUG] reviews.length:', reviews.length);
    if (getUserReviewsDto.currentUserId && reviews.length > 0) {
      console.log('[DEBUG] Verificando reportes para currentUserId:', getUserReviewsDto.currentUserId);
      const reportPromises = reviews.map(async (review) => {
        console.log('[DEBUG] Procesando review.id:', review.id, 'reviewerUserId:', review.reviewerUserId);
        console.log('[DEBUG] Comparando:', getUserReviewsDto.currentUserId, '===', review.reviewerUserId, '?', getUserReviewsDto.currentUserId === review.reviewerUserId);
        // Si es el autor de la reseña, no puede reportarla
        if (getUserReviewsDto.currentUserId === review.reviewerUserId) {
          console.log('[DEBUG] Es el autor, no puede reportar');
          return { reviewId: review.id, hasReported: false };
        }
        console.log('[DEBUG] No es el autor, buscando reporte...');
        const report =
          await this.userReviewReportRepository.findByUserReviewAndReporter(
            review.id,
            getUserReviewsDto.currentUserId!,
          );
        console.log('[DEBUG] Reporte encontrado:', report ? 'SÍ (id: ' + report.id + ')' : 'NO');
        return { reviewId: review.id, hasReported: report !== null };
      });
      const results = await Promise.all(reportPromises);
      results.forEach(({ reviewId, hasReported }) => {
        console.log('[DEBUG] Resultado final - reviewId:', reviewId, 'hasReported:', hasReported);
        hasReportedMap.set(reviewId, hasReported);
      });
      console.log('[DEBUG] hasReportedMap:', Array.from(hasReportedMap.entries()));
    } else {
      console.log('[DEBUG] No se ejecutó la verificación de reportes');
    }

    // Mapear las reseñas y agregar el campo hasReported
    const mappedReviews = UserReviewMapper.mapToResponseArray(reviews);
    const reviewsWithReportStatus = mappedReviews.map((review) => ({
      ...review,
      hasReported: hasReportedMap.get(review.id) ?? false,
    }));

    return {
      reviews: reviewsWithReportStatus,
      pagination,
      hasReviewed,
    };
  }
}
