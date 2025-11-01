import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UsersClientService } from '../../../common/services/users-client.service';
import { ServiceReviewRepository } from '../../repositories/service-review.repository';
import { ServiceReviewNotFoundException } from 'src/common/exceptions/service-review.exceptions';

@Injectable()
export class GetServiceReviewByIdUseCase {
  constructor(
    private readonly reviewRepository: ServiceReviewRepository,
    private readonly usersClient: UsersClientService,
  ) {}

  async execute(reviewId: number, currentUserId?: number) {
    // Buscar la reseña por ID
    const review = await this.reviewRepository.findOneById(reviewId);

    if (!review) {
     throw new ServiceReviewNotFoundException(reviewId);
    }

    // Obtener información del reviewer
    const [reviewerUser] = await this.usersClient.getUsersByIds([
      review.reviewerUserId,
    ]);

    // Obtener información del service owner
    const [serviceOwnerUser] = await this.usersClient.getUsersByIds([
      review.serviceOwnerUserId,
    ]);

    const reviewerProfile = reviewerUser?.profile;
    const serviceOwnerProfile = serviceOwnerUser?.profile;

    const isOwner = currentUserId === review.reviewerUserId;
    const isServiceOwner = currentUserId === review.serviceOwnerUserId;

    return {
      id: review.id,
      serviceId: review.serviceId,
      hiringId: review.hiringId,
      rating: review.rating,
      comment: review.comment,
      ownerResponse: review.ownerResponse,
      ownerResponseDate: review.ownerResponseDate,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      isOwner, // Indica si el usuario actual es el dueño de esta reseña
      isServiceOwner, // Indica si el usuario actual es el dueño del servicio
      // Reviewer info
      reviewUser: reviewerProfile
        ? {
            id: reviewerUser.id,
            name: reviewerProfile.name,
            lastName: reviewerProfile.lastName,
            profilePicture: reviewerProfile.profilePicture,
            profession: reviewerProfile.profession,
          }
        : null,
      // Service owner info
      serviceOwner: serviceOwnerProfile
        ? {
            id: serviceOwnerUser.id,
            name: serviceOwnerProfile.name,
            lastName: serviceOwnerProfile.lastName,
            profilePicture: serviceOwnerProfile.profilePicture,
            profession: serviceOwnerProfile.profession,
          }
        : null,
    };
  }
}
