import { Injectable } from '@nestjs/common';
import { ServiceReview } from '../../service-reviews/entities/service-review.entity';
import { ServiceReviewRepository } from '../../service-reviews/repositories/service-review.repository';
import { ServiceReviewReportReason } from '../enums/service-review-report-reason.enum';
import {
    CannotReportOwnReviewException,
    InvalidServiceReviewReportReasonException,
    ServiceReviewAlreadyReportedException,
    ServiceReviewNotFoundForReportException,
} from '../exceptions/service-review-report.exceptions';
import { ServiceReviewReportRepository } from '../repositories/service-review-report.repository';

@Injectable()
export class ServiceReviewReportValidationService {
  constructor(
    private readonly serviceReviewReportRepository: ServiceReviewReportRepository,
    private readonly serviceReviewRepository: ServiceReviewRepository,
  ) {}

  /**
   * Valida que la reseña del servicio existe
   */
  async validateServiceReviewExists(
    serviceReviewId: number,
  ): Promise<ServiceReview> {
    const serviceReview =
      await this.serviceReviewRepository.findById(serviceReviewId);

    if (!serviceReview) {
      throw new ServiceReviewNotFoundForReportException(serviceReviewId);
    }

    return serviceReview;
  }

  /**
   * Valida que el usuario no haya reportado ya la reseña
   */
  async validateUserNotAlreadyReported(
    serviceReviewId: number,
    reporterId: number,
  ): Promise<void> {
    const existingReport =
      await this.serviceReviewReportRepository.findByServiceReviewAndReporter(
        serviceReviewId,
        reporterId,
      );

    if (existingReport) {
      throw new ServiceReviewAlreadyReportedException();
    }
  }

  /**
   * Valida el motivo del reporte
   */
  validateReportReason(
    reason: ServiceReviewReportReason,
    otherReason?: string,
  ): void {
    if (reason === ServiceReviewReportReason.OTHER && !otherReason) {
      throw new InvalidServiceReviewReportReasonException();
    }
  }

  /**
   * Valida que el usuario no esté reportando su propia reseña
   */
  validateNotOwnReview(review: ServiceReview, reporterId: number): void {
    if (review.reviewerUserId === reporterId) {
      throw new CannotReportOwnReviewException();
    }
  }
}
