import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../../../../common/services/email.service';
import { UsersClientService } from '../../../../common/services/users-client.service';
import { PeerReviewComplianceDto } from '../../../dto/compliance.dto';
import { ClaimCompliance } from '../../../entities/claim-compliance.entity';
import { ComplianceStatus } from '../../../enums/compliance.enum';
import { ClaimComplianceRepository } from '../../../repositories/claim-compliance.repository';
import { ComplianceSubmissionRepository } from '../../../repositories/compliance-submission.repository';
import { ServiceHiringRepository } from '../../../repositories/service-hiring.repository';

/**
 * Use case para que la contraparte revise y pre-apruebe/objete un compliance
 */
@Injectable()
export class PeerReviewComplianceUseCase {
  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly submissionRepository: ComplianceSubmissionRepository,
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly emailService: EmailService,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(dto: PeerReviewComplianceDto): Promise<ClaimCompliance> {
    // 1. Buscar el compliance con su claim
    const compliance = await this.complianceRepository.findOne({
      where: { id: dto.complianceId },
      relations: ['claim'],
    });
    if (!compliance) {
      throw new NotFoundException(
        `Compliance con ID ${dto.complianceId} no encontrado`,
      );
    }

    // 2. Validar estado
    if (compliance.status !== ComplianceStatus.SUBMITTED) {
      throw new BadRequestException(
        'Solo se puede revisar un compliance en estado SUBMITTED',
      );
    }

    // 3. Obtener el hiring para determinar quién es la contraparte
    const hiring = await this.hiringRepository.findById(
      compliance.claim.hiringId,
      ['service'],
    );

    if (!hiring) {
      throw new NotFoundException(
        `Hiring con ID ${compliance.claim.hiringId} no encontrado`,
      );
    }

    // 4. Validar que el usuario sea la contraparte (no el responsable)
    const isClient = hiring.userId === parseInt(dto.userId);
    const isProvider = hiring.service.userId === parseInt(dto.userId);
    const isCounterpart =
      (compliance.responsibleUserId === hiring.userId.toString() &&
        isProvider) ||
      (compliance.responsibleUserId === hiring.service.userId.toString() &&
        isClient);

    if (!isCounterpart) {
      throw new ForbiddenException(
        'Solo la contraparte puede hacer peer review',
      );
    }

    // 5. Actualizar compliance según la decisión
    compliance.peerReviewedBy = dto.userId;
    compliance.peerApproved = dto.approved;
    compliance.peerReviewedAt = new Date();
    compliance.peerReviewReason = dto.reason || null;

    if (dto.approved) {
      compliance.status = ComplianceStatus.PEER_APPROVED;
      console.log(
        `[PeerReviewComplianceUseCase] Compliance ${compliance.id} pre-aprobado por peer`,
      );
    } else {
      compliance.status = ComplianceStatus.PEER_OBJECTED;
      console.log(
        `[PeerReviewComplianceUseCase] Compliance ${compliance.id} objetado por peer`,
      );
    }

    await this.complianceRepository.save(compliance);

    // 6. Actualizar el submission actual con los datos del peer review
    try {
      const currentSubmission =
        await this.submissionRepository.getCurrentSubmission(compliance.id);

      if (currentSubmission) {
        await this.submissionRepository.updateWithPeerReview(
          currentSubmission.id,
          {
            peerReviewedBy: dto.userId,
            peerApproved: dto.approved,
            peerReviewReason: dto.reason || null,
            peerReviewedAt: new Date(),
          },
        );
        console.log(
          `[PeerReviewComplianceUseCase] Submission ${currentSubmission.id} actualizado con peer review`,
        );
      } else {
        console.warn(
          `[PeerReviewComplianceUseCase] No se encontró submission para compliance ${compliance.id}`,
        );
      }
    } catch (submissionError) {
      console.error(
        '[PeerReviewComplianceUseCase] Error actualizando submission:',
        submissionError,
      );
      // No lanzar error, solo loguear
    }

    // Enviar emails de notificación
    try {
      const hiringTitle = hiring.service?.title || 'Servicio sin título';

      // Obtener datos del peer reviewer
      const peerReviewer =
        await this.usersClientService.getUserByIdWithRelations(
          parseInt(dto.userId),
        );
      const peerReviewerFirstName =
        peerReviewer?.profile?.firstName ||
        peerReviewer?.profile?.name ||
        'Usuario';
      const peerReviewerLastName = peerReviewer?.profile?.lastName || '';
      const peerReviewerName =
        `${peerReviewerFirstName} ${peerReviewerLastName}`.trim();

      // Obtener datos del usuario responsable
      const responsibleUser =
        await this.usersClientService.getUserByIdWithRelations(
          parseInt(compliance.responsibleUserId),
        );

      const responsibleUserName =
        responsibleUser?.profile?.firstName ||
        responsibleUser?.profile?.name ||
        'Usuario';

      if (responsibleUser) {
        // Enviar email al usuario responsable
        if (dto.approved) {
          await this.emailService.sendCompliancePeerApprovedEmail(
            responsibleUser.email,
            responsibleUserName,
            peerReviewerName,
            {
              complianceId: compliance.id,
              complianceType: compliance.complianceType,
              claimId: compliance.claimId,
              hiringTitle,
              peerReviewReason: compliance.peerReviewReason,
            },
          );
        } else {
          await this.emailService.sendCompliancePeerRejectedEmail(
            responsibleUser.email,
            responsibleUserName,
            peerReviewerName,
            {
              complianceId: compliance.id,
              complianceType: compliance.complianceType,
              claimId: compliance.claimId,
              hiringTitle,
              peerReviewReason: compliance.peerReviewReason,
            },
          );
        }
      }

      // Enviar email al moderador si está asignado
      const moderatorId = compliance.claim.assignedModeratorId;
      if (moderatorId) {
        const moderator =
          await this.usersClientService.getUserByIdWithRelations(moderatorId);

        if (moderator) {
          const statusText = dto.approved ? 'aprobado' : 'objetado';

          await this.emailService.sendPeerReviewToModeratorEmail(
            moderator.email,
            responsibleUserName,
            peerReviewerName,
            statusText,
            {
              complianceId: compliance.id,
              complianceType: compliance.complianceType,
              claimId: compliance.claimId,
              hiringTitle,
              peerReviewReason: dto.reason,
            },
          );
        }
      }

      // Enviar email al moderador que resolvió el reclamo originalmente
      const resolvedByModeratorId = compliance.claim.resolvedBy;
      if (resolvedByModeratorId && resolvedByModeratorId !== moderatorId) {
        const resolvedByModerator =
          await this.usersClientService.getUserByIdWithRelations(
            resolvedByModeratorId,
          );

        if (resolvedByModerator) {
          const statusText = dto.approved ? 'aprobado' : 'objetado';
          await this.emailService.sendPeerReviewToModeratorEmail(
            resolvedByModerator.email,
            responsibleUserName,
            peerReviewerName,
            statusText,
            {
              complianceId: compliance.id,
              complianceType: compliance.complianceType,
              claimId: compliance.claimId,
              hiringTitle,
              peerReviewReason: dto.reason,
            },
          );
        }
      }
    } catch (emailError) {
      console.error(
        '[PeerReviewComplianceUseCase] Error enviando emails:',
        emailError,
      );
      // No lanzar error, solo loguear
    }

    return compliance;
  }
}
