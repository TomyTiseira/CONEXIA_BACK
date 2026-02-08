import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceSubmission } from '../entities/compliance-submission.entity';

@Injectable()
export class ComplianceSubmissionRepository {
  constructor(
    @InjectRepository(ComplianceSubmission)
    private readonly repository: Repository<ComplianceSubmission>,
  ) {}

  /**
   * Crea una nueva submission
   */
  async createSubmission(data: {
    complianceId: string;
    attemptNumber: number;
    evidenceUrls: string[];
    userNotes: string | null;
    submittedAt: Date;
  }): Promise<ComplianceSubmission> {
    const submission = this.repository.create({
      complianceId: data.complianceId,
      attemptNumber: data.attemptNumber,
      status: 'pending_review',
      evidenceUrls: data.evidenceUrls,
      userNotes: data.userNotes,
      submittedAt: data.submittedAt,
    });

    return await this.repository.save(submission);
  }

  /**
   * Obtiene todas las submissions de un compliance
   */
  async getSubmissionsByCompliance(
    complianceId: string,
  ): Promise<ComplianceSubmission[]> {
    return await this.repository.find({
      where: { complianceId },
      order: { attemptNumber: 'ASC' },
    });
  }

  /**
   * Obtiene la submission actual (último intento)
   */
  async getCurrentSubmission(
    complianceId: string,
  ): Promise<ComplianceSubmission | null> {
    return await this.repository.findOne({
      where: { complianceId },
      order: { attemptNumber: 'DESC' },
    });
  }

  /**
   * Obtiene historial de submissions para auditoría
   */
  async getAttemptHistory(
    complianceId: string,
  ): Promise<ComplianceSubmission[]> {
    return await this.repository.find({
      where: { complianceId },
      order: { attemptNumber: 'ASC' },
      select: [
        'id',
        'attemptNumber',
        'status',
        'submittedAt',
        'reviewedAt',
        'moderatorDecision',
        'rejectionReason',
        'peerApproved',
      ],
    });
  }

  /**
   * Actualiza una submission con los resultados de la revisión del moderador
   */
  async updateWithModeratorReview(
    submissionId: string,
    data: {
      reviewedBy: string;
      reviewedAt: Date;
      moderatorDecision: 'approve' | 'reject' | 'adjust';
      moderatorNotes: string | null;
      rejectionReason: string | null;
      status: string;
    },
  ): Promise<void> {
    await this.repository.update(submissionId, data);
  }

  /**
   * Actualiza una submission con los resultados del peer review
   */
  async updateWithPeerReview(
    submissionId: string,
    data: {
      peerReviewedBy: string;
      peerApproved: boolean;
      peerReviewReason: string | null;
      peerReviewedAt: Date;
    },
  ): Promise<void> {
    await this.repository.update(submissionId, data);
  }
}
