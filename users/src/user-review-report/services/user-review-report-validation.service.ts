import { Injectable } from '@nestjs/common';
import { UserReview } from '../../shared/entities/user-review.entity';
import { UserReviewRepository } from '../../user-reviews/repository/user-review.repository';
import { UserReviewReportReason } from '../enums/user-review-report-reason.enum';
import {
  InvalidReportReasonException,
  UserAlreadyReportedException,
  UserReviewNotFoundException,
} from '../exceptions/user-review-report.exceptions';
import { UserReviewReportRepository } from '../repositories/user-review-report.repository';

@Injectable()
export class UserReviewReportValidationService {
  constructor(
    private readonly userReviewReportRepository: UserReviewReportRepository,
    private readonly userReviewRepository: UserReviewRepository,
  ) {}

  /**
   * Valida que la reseña existe
   * @param userReviewId - ID de la reseña
   * @returns La reseña si existe
   */
  async validateUserReviewExists(userReviewId: number): Promise<UserReview> {
    const userReview = await this.userReviewRepository.findById(userReviewId);

    if (!userReview) {
      throw new UserReviewNotFoundException(userReviewId);
    }

    return userReview;
  }

  /**
   * Valida que el usuario no haya reportado ya la reseña
   * @param userReviewId - ID de la reseña
   * @param reporterId - ID del usuario que reporta
   */
  async validateUserNotAlreadyReported(
    userReviewId: number,
    reporterId: number,
  ): Promise<void> {
    const existingReport =
      await this.userReviewReportRepository.findByUserReviewAndReporter(
        userReviewId,
        reporterId,
      );

    if (existingReport) {
      throw new UserAlreadyReportedException();
    }
  }

  /**
   * Valida el motivo del reporte
   * @param reason - Motivo del reporte
   * @param otherReason - Motivo personalizado si se selecciona "Otro"
   */
  validateReportReason(
    reason: UserReviewReportReason,
    otherReason?: string,
  ): void {
    if (reason === UserReviewReportReason.OTHER && !otherReason) {
      throw new InvalidReportReasonException();
    }
  }
}
