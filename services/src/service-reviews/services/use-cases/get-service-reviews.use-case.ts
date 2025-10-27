import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { GetServiceReviewsDto } from '../../dto/get-service-reviews.dto';
import { ServiceReviewRepository } from '../../repositories/service-review.repository';

@Injectable()
export class GetServiceReviewsUseCase {
  constructor(
    private readonly reviewRepository: ServiceReviewRepository,
    private readonly usersClient: UsersClientService,
  ) {}

  async execute(serviceId: number, dto: GetServiceReviewsDto, currentUserId?: number) {
    const { page = 1, limit = 10, rating } = dto;

    const { reviews, total } = await this.reviewRepository.findByServiceId(
      serviceId,
      page,
      limit,
      rating,
    );

    // Get unique user IDs from reviews
    const userIds = Array.from(
      new Set(reviews.map((review) => review.reviewerUserId)),
    );

    // Fetch user data from users microservice
    const users = await this.usersClient.getUsersByIds(userIds);

    // Create a map for quick lookup
    const usersMap = new Map(users.map((user) => [user.id, user]));

    // Enrich reviews with only necessary reviewer data
    const enrichedReviews = reviews.map((review) => {
      const user = usersMap.get(review.reviewerUserId);
      const profile = user?.profile;
      const isOwner = currentUserId === review.reviewerUserId;

      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        ownerResponse: review.ownerResponse,
        ownerResponseDate: review.ownerResponseDate,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        isOwner, // Indica si el usuario actual es el dueño de esta reseña
        // Reviewer info in nested object
        reviewUser: profile
          ? {
              id: user.id,
              name: profile.name,
              lastName: profile.lastName,
              profilePicture: profile.profilePicture,
              profession: profile.profession,
            }
          : null,
      };
    });

    const { average } =
      await this.reviewRepository.getServiceAverageRating(serviceId);

    const ratingDistribution =
      await this.reviewRepository.getRatingDistribution(serviceId);

    return {
      reviews: enrichedReviews,
      total,
      averageRating: average,
      ratingDistribution,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
