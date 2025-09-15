import { Injectable } from '@nestjs/common';
import { Publication } from '../../publications/entities/publication.entity';
import { PublicationRepository } from '../../publications/repositories/publication.repository';
import { PublicationReportReason } from '../enums/publication-report-reason.enum';
import {
  InvalidReportReasonException,
  PublicationAlreadyReportedException,
  PublicationNotActiveException,
  PublicationNotFoundException,
} from '../exceptions/publication-report.exceptions';
import { PublicationReportRepository } from '../repositories/publication-report.repository';

@Injectable()
export class PublicationReportValidationService {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly publicationReportRepository: PublicationReportRepository,
  ) {}

  /**
   * Valida que una publicación existe y está activa
   * @param publicationId - ID de la publicación
   * @returns La publicación si existe y está activa
   */
  async validatePublicationExistsAndActive(
    publicationId: number,
  ): Promise<Publication> {
    const publication = await this.publicationRepository.findOne({
      where: { id: publicationId },
    });

    if (!publication) {
      throw new PublicationNotFoundException(publicationId);
    }

    if (!publication.isActive || publication.deletedAt) {
      throw new PublicationNotActiveException(publicationId);
    }

    return publication;
  }

  /**
   * Valida que un usuario no haya reportado ya la publicación
   * @param publicationId - ID de la publicación
   * @param userId - ID del usuario
   */
  async validateUserNotAlreadyReported(
    publicationId: number,
    userId: number,
  ): Promise<void> {
    const existingReport =
      await this.publicationReportRepository.findByPublicationAndReporter(
        publicationId,
        userId,
      );

    if (existingReport) {
      throw new PublicationAlreadyReportedException(userId, publicationId);
    }
  }

  /**
   * Valida que el motivo del reporte sea válido
   * @param reason - Motivo del reporte
   * @param otherReason - Descripción adicional si el motivo es "Otro"
   */
  validateReportReason(
    reason: PublicationReportReason,
    otherReason?: string,
  ): void {
    if (reason === PublicationReportReason.OTHER) {
      if (!otherReason || otherReason.trim().length === 0) {
        throw new InvalidReportReasonException(
          'Other reason is required when report reason is "Otro"',
        );
      }
    }
  }
}
