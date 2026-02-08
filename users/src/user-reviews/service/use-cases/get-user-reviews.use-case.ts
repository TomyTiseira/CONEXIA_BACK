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
      const existingReview =
        await this.userReviewRepository.findByReviewerAndReviewed(
          getUserReviewsDto.currentUserId,
          getUserReviewsDto.userId,
        );
      hasReviewed = !!existingReview;
    }

    // Mapear las reseñas
    const mappedReviews = UserReviewMapper.mapToResponseArray(reviews);

    // Verificar si el usuario actual reportó o es el autor de cada reseña
    const reviewsWithStatus = await Promise.all(
      mappedReviews.map(async (review) => {
        let hasReported = false;
        let hasReviewed = false;

        if (getUserReviewsDto.currentUserId) {
          // Verificar si ya reportó esta reseña
          const existingReport =
            await this.userReviewReportRepository.findByUserReviewAndReporter(
              review.id,
              getUserReviewsDto.currentUserId,
            );
          hasReported = !!existingReport;

          // Verificar si el usuario actual es quien hizo esta reseña
          hasReviewed =
            review.reviewerUserId === getUserReviewsDto.currentUserId;
        }

        return {
          ...review,
          hasReported,
          hasReviewed,
        };
      }),
    );

    return {
      reviews: reviewsWithStatus,
      pagination,
      hasReviewed,
    };
  }
}
