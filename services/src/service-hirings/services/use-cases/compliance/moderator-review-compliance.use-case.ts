import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../../../../common/services/email.service';
import { UsersClientService } from '../../../../common/services/users-client.service';
import { ModeratorReviewComplianceDto } from '../../../dto/compliance.dto';
import { ClaimCompliance } from '../../../entities/claim-compliance.entity';
import { ComplianceStatus } from '../../../enums/compliance.enum';
import { ClaimComplianceRepository } from '../../../repositories/claim-compliance.repository';

/**
 * Use case para que un moderador revise y apruebe/rechace finalmente un compliance
 */
@Injectable()
export class ModeratorReviewComplianceUseCase {
  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly emailService: EmailService,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(dto: ModeratorReviewComplianceDto): Promise<ClaimCompliance> {
    // 1. Buscar el compliance
    const compliance = await this.complianceRepository.findOne({
      where: { id: dto.complianceId },
      relations: ['claim', 'claim.hiring', 'claim.hiring.service'],
    });
    if (!compliance) {
      throw new NotFoundException(
        `Compliance con ID ${dto.complianceId} no encontrado`,
      );
    }

    // 2. Validar que esté en un estado revisable
    const reviewableStatuses = [
      ComplianceStatus.SUBMITTED,
      ComplianceStatus.PEER_APPROVED,
      ComplianceStatus.PEER_OBJECTED,
      ComplianceStatus.IN_REVIEW,
    ];

    if (!reviewableStatuses.includes(compliance.status)) {
      throw new BadRequestException(
        `No se puede revisar un compliance en estado ${compliance.status}`,
      );
    }

    // 3. Procesar según decisión del moderador
    if (dto.decision === 'approve') {
      // APROBADO ✅
      compliance.status = ComplianceStatus.APPROVED;
      compliance.reviewedAt = new Date();
      compliance.reviewedBy = dto.moderatorId;
      compliance.moderatorNotes = dto.moderatorNotes || null;
      compliance.rejectionReason = null;

      console.log(
        `[ModeratorReviewComplianceUseCase] Compliance ${compliance.id} APROBADO por moderador ${dto.moderatorId}`,
      );

      // Enviar email de aprobación
      await this.sendApprovalEmail(compliance);
    } else if (dto.decision === 'adjust') {
      // REQUIERE AJUSTE (no es rechazo completo)
      compliance.status = ComplianceStatus.REQUIRES_ADJUSTMENT;
      compliance.reviewedAt = new Date();
      compliance.reviewedBy = dto.moderatorId;
      compliance.moderatorNotes =
        dto.adjustmentInstructions ||
        dto.moderatorNotes ||
        'Requiere ajustes menores';
      compliance.rejectionReason = null;

      console.log(
        `[ModeratorReviewComplianceUseCase] Compliance ${compliance.id} requiere ajuste`,
      );

      // TODO: Enviar email de ajustes requeridos
    } else {
      // RECHAZADO ❌
      compliance.status = ComplianceStatus.REJECTED;
      compliance.reviewedAt = new Date();
      compliance.reviewedBy = dto.moderatorId;
      compliance.moderatorNotes = dto.moderatorNotes || null;
      compliance.rejectionReason =
        dto.rejectionReason || 'No cumple con los requisitos';
      compliance.rejectionCount += 1;

      console.log(
        `[ModeratorReviewComplianceUseCase] Compliance ${compliance.id} RECHAZADO (conteo: ${compliance.rejectionCount})`,
      );

      // Enviar email de rechazo
      await this.sendRejectionEmail(compliance);
    }

    await this.complianceRepository.save(compliance);

    return compliance;
  }

  /**
   * Envía email cuando se aprueba un compliance
   */
  private async sendApprovalEmail(compliance: ClaimCompliance): Promise<void> {
    try {
      const responsibleUser =
        await this.usersClientService.getUserByIdWithRelations(
          Number(compliance.responsibleUserId),
        );

      if (responsibleUser && responsibleUser.email) {
        const responsibleUserName =
          responsibleUser.profile?.firstName ||
          responsibleUser.profile?.name ||
          'Usuario';

        await this.emailService.sendComplianceApprovedEmail(
          responsibleUser.email,
          responsibleUserName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle:
              compliance.claim?.hiring?.service?.title || 'Servicio sin título',
            moderatorNotes: compliance.moderatorNotes,
          },
        );
      }
    } catch (error) {
      console.error(
        '[ModeratorReviewComplianceUseCase] Error enviando email de aprobación:',
        error,
      );
      // No lanzar error, solo loguear
    }
  }

  /**
   * Envía email cuando se rechaza un compliance
   */
  private async sendRejectionEmail(compliance: ClaimCompliance): Promise<void> {
    try {
      const responsibleUser =
        await this.usersClientService.getUserByIdWithRelations(
          Number(compliance.responsibleUserId),
        );

      if (responsibleUser && responsibleUser.email) {
        const responsibleUserName =
          responsibleUser.profile?.firstName ||
          responsibleUser.profile?.name ||
          'Usuario';

        await this.emailService.sendComplianceRejectedEmail(
          responsibleUser.email,
          responsibleUserName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle:
              compliance.claim?.hiring?.service?.title || 'Servicio sin título',
            rejectionReason: compliance.rejectionReason,
            rejectionCount: compliance.rejectionCount,
          },
        );
      }
    } catch (error) {
      console.error(
        '[ModeratorReviewComplianceUseCase] Error enviando email de rechazo:',
        error,
      );
      // No lanzar error, solo loguear
    }
  }
}
