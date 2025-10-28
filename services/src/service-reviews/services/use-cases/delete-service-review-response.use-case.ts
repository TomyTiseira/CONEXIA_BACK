import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceReview } from '../../entities/service-review.entity';
import { ServiceReviewRepository } from '../../repositories/service-review.repository';

/**
 * Use Case: Eliminar la respuesta del dueño del servicio a una reseña
 * Solo el dueño del servicio que hizo la respuesta puede eliminarla
 */
@Injectable()
export class DeleteServiceReviewResponseUseCase {
  constructor(private readonly reviewRepository: ServiceReviewRepository) {}

  async execute(userId: number, reviewId: number): Promise<ServiceReview> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Verificar que el usuario es el dueño del servicio
    if (review.serviceOwnerUserId !== userId) {
      throw new ForbiddenException(
        'Only the service owner can delete their response',
      );
    }

    // Verificar que existe una respuesta para eliminar
    if (!review.ownerResponse) {
      throw new NotFoundException('There is no response to delete');
    }

    // Eliminar la respuesta estableciendo los campos en null
    const updatedReview = await this.reviewRepository.update(reviewId, {
      ownerResponse: null,
      ownerResponseDate: null,
    });

    return updatedReview!;
  }
}
