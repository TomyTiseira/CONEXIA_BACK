import { Injectable } from '@nestjs/common';
import {
  calculatePagination,
  PaginationInfo,
} from 'src/common/utils/pagination.utils';
import { GetUserReviewsDto } from '../../dto/get-user-reviews.dto';
import {
  MappedUserReview,
  UserReviewMapper,
} from '../../mappers/user-review.mapper';
import { UserReviewRepository } from '../../repository/user-review.repository';

export interface GetUserReviewsResult {
  reviews: MappedUserReview[];
  pagination: PaginationInfo;
}

@Injectable()
export class GetUserReviewsUseCase {
  constructor(private readonly userReviewRepository: UserReviewRepository) {}

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

    return {
      reviews: UserReviewMapper.mapToResponseArray(reviews),
      pagination,
    };
  }
}
