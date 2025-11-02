import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { ServiceReviewReportRepository } from '../../../service-review-reports/repositories/service-review-report.repository';
import { GetServiceReviewsDto } from '../../dto/get-service-reviews.dto';
import { ServiceReviewRepository } from '../../repositories/service-review.repository';

@Injectable()
export class GetServiceReviewsUseCase {
  constructor(
    private readonly reviewRepository: ServiceReviewRepository,
    private readonly usersClient: UsersClientService,
    private readonly reviewReportRepository: ServiceReviewReportRepository,
  ) {}

  async execute(serviceId: number, dto: GetServiceReviewsDto, currentUserId?: number) {
    const params = {
      ...dto,
      page: dto.page || 1,
      limit: dto.limit || 10,
    };

    const { reviews, total } = await this.reviewRepository.findByServiceId(
      serviceId,
      params.page,
      params.limit,
      params.rating,
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

    // Verificar si el usuario actual reportó cada reseña (batch query)
    const hasReportedMap = new Map<number, boolean>();
    if (currentUserId) {
      // Consultar reportes en batch para todas las reseñas
      const reviewIds = reviews.map(r => r.id);
      const reportPromises = reviewIds.map(async (reviewId) => {
        const review = reviews.find(r => r.id === reviewId);
        // Si el usuario es el dueño de la reseña, hasReported = false (no puede reportar su propia reseña)
        if (currentUserId === review?.reviewerUserId) {
          return { reviewId, hasReported: false };
        }
        const report = await this.reviewReportRepository.findByServiceReviewAndReporter(
          reviewId,
          currentUserId,
        );
        return { reviewId, hasReported: report !== null };
      });
      const results = await Promise.all(reportPromises);
      results.forEach(({ reviewId, hasReported }) => {
        hasReportedMap.set(reviewId, hasReported);
      });
    }

    // Enrich reviews with reviewer and service owner data
    const enrichedReviews = reviews.map((review) => {
      const reviewer = usersMap.get(review.reviewerUserId);
      const reviewerProfile = reviewer?.profile;
      
      const serviceOwner = serviceOwnersMap.get(review.serviceOwnerUserId);
      const serviceOwnerProfile = serviceOwner?.profile;
      
      const isOwner = currentUserId === review.reviewerUserId;
      const isServiceOwner = currentUserId === review.serviceOwnerUserId;
      const hasReported = hasReportedMap.get(review.id) || false;

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
        hasReported, // Indica si el usuario actual ya reportó esta reseña
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

    const pagination = calculatePagination(total, params);

    return {
      reviews: enrichedReviews,
      averageRating: average,
      ratingDistribution,
      pagination,
    };
  }
}
