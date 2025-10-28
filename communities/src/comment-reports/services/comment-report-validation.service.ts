import { Injectable } from '@nestjs/common';
import { PublicationComment } from '../../publications/entities/publication-comment.entity';
import { CommentRepository } from '../../publications/repositories/comment.repository';
import { CommentReportReason } from '../enums/comment-report-reason.enum';
import {
  CommentAlreadyReportedException,
  CommentNotActiveException,
  CommentNotFoundException,
  InvalidReportReasonException,
} from '../exceptions/comment-report.exceptions';
import { CommentReportRepository } from '../repositories/comment-report.repository';

@Injectable()
export class CommentReportValidationService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly commentReportRepository: CommentReportRepository,
  ) {}

  /**
   * Valida que un comentario existe y está activo
   * @param commentId - ID del comentario
   * @returns El comentario si existe y está activo
   */
  async validateCommentExistsAndActive(
    commentId: number,
  ): Promise<PublicationComment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new CommentNotFoundException(commentId);
    }

    if (!comment.isActive || comment.deletedAt) {
      throw new CommentNotActiveException(commentId);
    }

    return comment;
  }

  /**
   * Valida que un usuario no haya reportado ya el comentario
   * @param commentId - ID del comentario
   * @param userId - ID del usuario
   */
  async validateUserNotAlreadyReported(
    commentId: number,
    userId: number,
  ): Promise<void> {
    const existingReport =
      await this.commentReportRepository.findByCommentAndReporter(
        commentId,
        userId,
      );

    if (existingReport) {
      throw new CommentAlreadyReportedException(userId, commentId);
    }
  }

  /**
   * Valida que el motivo del reporte sea válido
   * @param reason - Motivo del reporte
   * @param otherReason - Descripción adicional si el motivo es "Otro"
   */
  validateReportReason(
    reason: CommentReportReason,
    otherReason?: string,
  ): void {
    if (reason === CommentReportReason.OTHER) {
      if (!otherReason || otherReason.trim().length === 0) {
        throw new InvalidReportReasonException(
          'Other reason is required when report reason is "Otro"',
        );
      }
    }
  }
}
