import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserReview } from '../../shared/entities/user-review.entity';
import { UserReviewReportReason } from '../enums/user-review-report-reason.enum';
import { UserReviewReportRepository } from '../repositories/user-review-report.repository';
import { UserReviewRepository } from '../repository/user-review.repository';

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
      throw new NotFoundException(
        `La reseña con ID ${userReviewId} no existe`,
      );
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
      throw new BadRequestException(
        'Ya has reportado esta reseña anteriormente',
      );
    }
  }

  /**
   * Valida que el usuario sea el dueño del perfil (reviewedUserId)
   * @param userReview - Reseña a validar
   * @param reporterId - ID del usuario que reporta
   */
  validateUserIsProfileOwner(
    userReview: UserReview,
    reporterId: number,
  ): void {
    if (userReview.reviewedUserId !== reporterId) {
      throw new ForbiddenException(
        'Solo el dueño del perfil puede reportar reseñas en su perfil',
      );
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
      throw new BadRequestException(
        'Debes proporcionar una descripción cuando seleccionas "Otro"',
      );
    }
  }
}
