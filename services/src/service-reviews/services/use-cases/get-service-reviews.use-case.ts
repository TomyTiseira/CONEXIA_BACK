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

    // Get unique service owner IDs from reviews
    const serviceOwnerIds = Array.from(
      new Set(reviews.map((review) => review.serviceOwnerUserId)),
    );

    // Fetch service owner data from users microservice
    const serviceOwners = await this.usersClient.getUsersByIds(serviceOwnerIds);

    // Create a map for quick lookup of service owners
    const serviceOwnersMap = new Map(serviceOwners.map((owner) => [owner.id, owner]));

    // Enrich reviews with reviewer and service owner data
    const enrichedReviews = reviews.map((review) => {
      const reviewer = usersMap.get(review.reviewerUserId);
      const reviewerProfile = reviewer?.profile;
      
      const serviceOwner = serviceOwnersMap.get(review.serviceOwnerUserId);
      const serviceOwnerProfile = serviceOwner?.profile;
      
      const isOwner = currentUserId === review.reviewerUserId;
      const isServiceOwner = currentUserId === review.serviceOwnerUserId;

      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        ownerResponse: review.ownerResponse,
        ownerResponseDate: review.ownerResponseDate,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        isOwner, // Indica si el usuario actual es el dueño de esta reseña
        isServiceOwner, // Indica si el usuario actual es el dueño del servicio (puede responder)
        // Reviewer info in nested object
        reviewUser: reviewerProfile
          ? {
              id: reviewer.id,
              name: reviewerProfile.name,
              lastName: reviewerProfile.lastName,
              profilePicture: reviewerProfile.profilePicture,
              profession: reviewerProfile.profession,
            }
          : null,
        // Service owner info in nested object
        serviceOwner: serviceOwnerProfile
          ? {
              id: serviceOwner.id,
              name: serviceOwnerProfile.name,
              lastName: serviceOwnerProfile.lastName,
              profilePicture: serviceOwnerProfile.profilePicture,
              profession: serviceOwnerProfile.profession,
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
