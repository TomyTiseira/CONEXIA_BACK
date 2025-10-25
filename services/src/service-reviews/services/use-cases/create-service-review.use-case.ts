import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ServiceHiringStatusCode } from '../../../service-hirings/enums/service-hiring-status.enum';
import { ServiceHiringRepository } from '../../../service-hirings/repositories/service-hiring.repository';
import { CreateServiceReviewDto } from '../../dto/create-service-review.dto';
import { ServiceReview } from '../../entities/service-review.entity';
import { ServiceReviewRepository } from '../../repositories/service-review.repository';

@Injectable()
export class CreateServiceReviewUseCase {
  constructor(
    private readonly reviewRepository: ServiceReviewRepository,
    private readonly hiringRepository: ServiceHiringRepository,
  ) {}

  async execute(
    userId: number,
    dto: CreateServiceReviewDto,
  ): Promise<ServiceReview> {
    const { hiringId, rating, comment } = dto;

    // Verify hiring exists with service relation
    const hiring = await this.hiringRepository.findById(hiringId);
    if (!hiring) {
      throw new NotFoundException('Hiring not found');
    }

    // Verify user is the client
    if (hiring.userId !== userId) {
      throw new ForbiddenException('Only the client can review this service');
    }

    // Verify hiring is in a completable state
    const completableStates = [
      ServiceHiringStatusCode.COMPLETED,
      ServiceHiringStatusCode.COMPLETED_BY_CLAIM,
      ServiceHiringStatusCode.COMPLETED_WITH_AGREEMENT,
    ];

    if (!completableStates.includes(hiring.status.code as ServiceHiringStatusCode)) {
      throw new BadRequestException(
        'Can only review completed service hirings',
      );
    }

    // Verify no existing review
    const existingReview =
      await this.reviewRepository.findByHiringId(hiringId);
    if (existingReview) {
      throw new BadRequestException('A review already exists for this hiring');
    }

    // Get service owner id
    if (!hiring.service) {
      throw new NotFoundException('Service not found');
    }

    // Create review
    const review = await this.reviewRepository.create({
      hiringId,
      serviceId: hiring.serviceId,
      reviewerUserId: userId,
      serviceOwnerUserId: hiring.service.userId,
      rating,
      comment,
    });

    return review;
  }
}
