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
import { ComplianceSubmissionRepository } from '../../../repositories/compliance-submission.repository';

/**
 * Use case para que un moderador revise y apruebe/rechace finalmente un compliance
 * Incluye sistema de consecuencias progresivas:
 * - 1er rechazo: Advertencia + vuelve a pending
 * - 2do rechazo: Suspensión 15 días
 * - 3er rechazo: Ban permanente
 */
@Injectable()
export class ModeratorReviewComplianceUseCase {
  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly submissionRepository: ComplianceSubmissionRepository,
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

    // 2. Validar que esté en un estado revisable (después de peer review)
    const reviewableStatuses = [
      ComplianceStatus.PEER_APPROVED,
      ComplianceStatus.PEER_OBJECTED,
      ComplianceStatus.IN_REVIEW,
    ];

    if (!reviewableStatuses.includes(compliance.status)) {
      throw new BadRequestException(
        `No se puede revisar un compliance en estado ${compliance.status}. Debe completarse el peer review primero.`,
      );
    }

    // 3. Obtener submission actual
    const currentSubmission =
      await this.submissionRepository.getCurrentSubmission(compliance.id);

    // 4. Procesar según decisión del moderador
    if (dto.decision === 'approve') {
      await this.handleApprove(compliance, currentSubmission, dto);
    } else if (dto.decision === 'adjust') {
      await this.handleAdjust(compliance, currentSubmission, dto);
    } else {
      await this.handleReject(compliance, currentSubmission, dto);
    }

    return compliance;
  }

  /**
   * Maneja la aprobación del compliance
   */
  private async handleApprove(
    compliance: ClaimCompliance,
    currentSubmission: any,
    dto: ModeratorReviewComplianceDto,
  ): Promise<void> {
    compliance.status = ComplianceStatus.APPROVED;
    compliance.reviewedAt = new Date();
    compliance.reviewedBy = dto.moderatorId;
    compliance.moderatorNotes = dto.moderatorNotes || null;
    compliance.rejectionReason = null;

    // Limpiar advertencias si las había
    if (compliance.hasActiveWarning) {
      compliance.hasActiveWarning = false;
    }

    // Actualizar submission si existe
    if (currentSubmission) {
      await this.submissionRepository.updateWithModeratorReview(
        currentSubmission.id,
        {
          reviewedBy: dto.moderatorId,
          reviewedAt: new Date(),
          moderatorDecision: 'approve',
          moderatorNotes: dto.moderatorNotes || null,
          rejectionReason: null,
          status: 'approved',
        },
      );
    }

    await this.complianceRepository.save(compliance);

    console.log(
      `[ModeratorReview] Compliance ${compliance.id} APROBADO por moderador ${dto.moderatorId}`,
    );

    // Enviar email de aprobación
    await this.sendApprovalEmail(compliance);
  }

  /**
   * Maneja el ajuste requerido (no cuenta como rechazo)
   */
  private async handleAdjust(
    compliance: ClaimCompliance,
    currentSubmission: any,
    dto: ModeratorReviewComplianceDto,
  ): Promise<void> {
    compliance.status = ComplianceStatus.REQUIRES_ADJUSTMENT;
    compliance.reviewedAt = new Date();
    compliance.reviewedBy = dto.moderatorId;
    compliance.moderatorNotes =
      dto.adjustmentInstructions ||
      dto.moderatorNotes ||
      'Requiere ajustes menores';
    compliance.rejectionReason = null;

    // NO incrementar rejectionCount ni currentAttempt
    // Es una segunda oportunidad sin consecuencias

    // Actualizar submission si existe
    if (currentSubmission) {
      await this.submissionRepository.updateWithModeratorReview(
        currentSubmission.id,
        {
          reviewedBy: dto.moderatorId,
          reviewedAt: new Date(),
          moderatorDecision: 'adjust',
          moderatorNotes:
            dto.adjustmentInstructions || dto.moderatorNotes || null,
          rejectionReason: null,
          status: 'requires_adjustment',
        },
      );
    }

    await this.complianceRepository.save(compliance);

    console.log(
      `[ModeratorReview] Compliance ${compliance.id} requiere ajuste`,
    );

    // Enviar email de ajuste requerido
    await this.sendAdjustmentEmail(compliance);
  }

  /**
   * Maneja el rechazo con consecuencias progresivas
   */
  private async handleReject(
    compliance: ClaimCompliance,
    currentSubmission: any,
    dto: ModeratorReviewComplianceDto,
  ): Promise<void> {
    compliance.reviewedAt = new Date();
    compliance.reviewedBy = dto.moderatorId;
    compliance.moderatorNotes = dto.moderatorNotes || null;
    compliance.rejectionReason =
      dto.rejectionReason || 'No cumple con los requisitos';
    compliance.rejectionCount += 1;

    const rejectionCount = compliance.rejectionCount;

    console.log(
      `[ModeratorReview] Compliance ${compliance.id} RECHAZADO (conteo: ${rejectionCount})`,
    );

    // Actualizar submission si existe
    if (currentSubmission) {
      await this.submissionRepository.updateWithModeratorReview(
        currentSubmission.id,
        {
          reviewedBy: dto.moderatorId,
          reviewedAt: new Date(),
          moderatorDecision: 'reject',
          moderatorNotes: dto.moderatorNotes || null,
          rejectionReason:
            dto.rejectionReason || 'No cumple con los requisitos',
          status: 'rejected',
        },
      );
    }

    // ============ LÓGICA DE CONSECUENCIAS ============

    if (rejectionCount === 1) {
      // PRIMER RECHAZO: ADVERTENCIA
      await this.applyFirstRejectionWarning(compliance, dto);
    } else if (rejectionCount === 2) {
      // SEGUNDO RECHAZO: SUSPENSIÓN 15 DÍAS
      await this.applySecondRejectionSuspension(compliance, dto);
    } else if (rejectionCount >= 3) {
      // TERCER RECHAZO: BAN PERMANENTE
      await this.applyThirdRejectionBan(compliance, dto);
    }

    await this.complianceRepository.save(compliance);
  }

  /**
   * Primer rechazo: Advertencia + vuelve a pending
   */
  private async applyFirstRejectionWarning(
    compliance: ClaimCompliance,
    dto: ModeratorReviewComplianceDto,
  ): Promise<void> {
    compliance.warningLevel = 1;
    compliance.hasActiveWarning = true;
    compliance.warningSentAt = new Date();
    compliance.status = ComplianceStatus.PENDING; // Vuelve a pending para resubir
    compliance.currentAttempt += 1;

    // Extender el deadline 7 días desde ahora para dar tiempo de resubir
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 7);
    compliance.deadline = newDeadline;

    // Resetear evidencia para que suba nueva
    compliance.evidenceUrls = [];
    compliance.userNotes = null;
    compliance.submittedAt = null;
    compliance.peerReviewedBy = null;
    compliance.peerApproved = null;
    compliance.peerReviewReason = null;
    compliance.peerReviewedAt = null;

    console.log(
      `[ModeratorReview] ⚠️  ADVERTENCIA: Usuario ${compliance.responsibleUserId} - Primer rechazo. Intento ${compliance.currentAttempt}/${compliance.maxAttempts}. Nuevo deadline: ${newDeadline.toISOString()}`,
    );

    // Enviar email de advertencia
    await this.sendWarningEmail(compliance, dto);
  }

  /**
   * Helper para obtener el label en español del tipo de compliance
   */
  private getComplianceTypeLabel(complianceType: string): string {
    const labels: Record<string, string> = {
      full_refund: 'reembolso total',
      partial_refund: 'reembolso parcial',
      partial_payment: 'pago parcial',
      payment_required: 'pago requerido',
      work_completion: 'completar trabajo',
      work_revision: 'revisión de trabajo',
      apology_required: 'disculpa requerida',
      service_discount: 'descuento en servicio',
      penalty_fee: 'tarifa de penalización',
      account_restriction: 'restricción de cuenta',
      confirmation_only: 'solo confirmación',
      additional_delivery: 'entrega adicional',
      corrected_delivery: 'entrega corregida',
      other: 'otro compromiso',
    };

    return labels[complianceType] || complianceType;
  }

  /**
   * Segundo rechazo: Suspensión 15 días + puede reintentar (tiene 1 oportunidad más)
   */
  private async applySecondRejectionSuspension(
    compliance: ClaimCompliance,
    dto: ModeratorReviewComplianceDto,
  ): Promise<void> {
    compliance.warningLevel = 2;
    compliance.status = ComplianceStatus.PENDING; // Vuelve a PENDING para que pueda reintentar
    compliance.suspensionTriggered = true;
    compliance.currentAttempt += 1; // Incrementar para el próximo intento (será el 3ro)

    // Resetear evidencia para que pueda subir nueva evidencia
    compliance.evidenceUrls = [];
    compliance.userNotes = null;
    compliance.submittedAt = null;
    compliance.peerReviewedBy = null;
    compliance.peerApproved = null;
    compliance.peerReviewReason = null;
    compliance.peerReviewedAt = null;

    // Extender el deadline 7 días más
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 7);
    compliance.deadline = newDeadline;

    console.log(
      `[ModeratorReview] 🚫 SUSPENSIÓN: Usuario ${compliance.responsibleUserId} - Segundo rechazo. Intento ${compliance.currentAttempt}/${compliance.maxAttempts}. Deadline extendido a: ${newDeadline.toISOString()}`,
    );

    // PRIMERO: Enviar email al usuario responsable explicando el rechazo y la suspensión
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

        const hiringTitle =
          compliance.claim?.hiring?.service?.title || 'Servicio sin título';

        const complianceLabel = this.getComplianceTypeLabel(
          compliance.complianceType,
        );

        const attemptsLeft =
          compliance.maxAttempts - compliance.currentAttempt + 1;

        const deadlineDate = compliance.deadline;
        const formattedDeadline = deadlineDate.toLocaleDateString('es', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        });

        await this.emailService.sendComplianceRejectedEmail(
          responsibleUser.email,
          responsibleUserName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle,
            rejectionReason:
              dto.rejectionReason ||
              dto.moderatorNotes ||
              'No cumple con los requisitos',
            moderatorNotes: dto.moderatorNotes || null,
            rejectionCount: compliance.rejectionCount,
            attemptsLeft,
            newDeadline: formattedDeadline,
            isSecondRejection: true,
            complianceLabel,
          },
        );
      }
    } catch (error) {
      console.error(
        '[ModeratorReview] Error enviando email de rechazo al usuario responsable:',
        error,
      );
    }

    // SEGUNDO: Llamar al microservicio de users para suspender (enviará email de suspensión)
    try {
      const complianceLabel = this.getComplianceTypeLabel(
        compliance.complianceType,
      );

      await this.usersClientService.suspendUserForComplianceViolation({
        userId: Number(compliance.responsibleUserId),
        complianceId: compliance.id,
        reason: `Segundo rechazo de compromiso: ${complianceLabel}`,
        days: 15,
        moderatorId: dto.moderatorId,
      });

      console.log(
        `[ModeratorReview] ✅ Usuario ${compliance.responsibleUserId} suspendido exitosamente por 15 días`,
      );
    } catch (error) {
      console.error(
        `[ModeratorReview] ❌ Error suspendiendo usuario ${compliance.responsibleUserId}:`,
        error,
      );
    }

    // Notificar a la otra parte sobre el rechazo y suspensión
    await this.notifyOtherPartyAboutRejection(compliance);
  }

  /**
   * Tercer rechazo: Ban permanente
   */
  private async applyThirdRejectionBan(
    compliance: ClaimCompliance,
    dto: ModeratorReviewComplianceDto,
  ): Promise<void> {
    compliance.warningLevel = 3;
    compliance.status = ComplianceStatus.REJECTED; // Estado final
    compliance.banTriggered = true;

    console.log(
      `[ModeratorReview] ⛔ BAN PERMANENTE: Usuario ${compliance.responsibleUserId} - Tercer rechazo`,
    );

    // PRIMERO: Enviar email al usuario responsable sobre el ban
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

        const hiringTitle =
          compliance.claim?.hiring?.service?.title || 'Servicio sin título';

        const complianceLabel = this.getComplianceTypeLabel(
          compliance.complianceType,
        );

        await this.emailService.sendComplianceRejectedEmail(
          responsibleUser.email,
          responsibleUserName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle,
            rejectionReason:
              dto.rejectionReason ||
              dto.moderatorNotes ||
              'No cumple con los requisitos',
            moderatorNotes: dto.moderatorNotes || null,
            rejectionCount: compliance.rejectionCount,
            complianceLabel,
          },
        );
      }
    } catch (error) {
      console.error(
        '[ModeratorReview] Error enviando email de rechazo al usuario responsable:',
        error,
      );
    }

    // SEGUNDO: Llamar al microservicio de users para banear (enviará email de ban al usuario responsable)
    try {
      const complianceLabel = this.getComplianceTypeLabel(
        compliance.complianceType,
      );

      await this.usersClientService.banUserForComplianceViolation({
        userId: Number(compliance.responsibleUserId),
        complianceId: compliance.id,
        reason: `Tercer rechazo de compromiso: ${complianceLabel}`,
        moderatorId: dto.moderatorId,
      });

      console.log(
        `[ModeratorReview] ✅ Usuario ${compliance.responsibleUserId} baneado exitosamente`,
      );
    } catch (error) {
      console.error(
        `[ModeratorReview] ❌ Error baneando usuario ${compliance.responsibleUserId}:`,
        error,
      );
    }

    // Notificar a la otra parte sobre el rechazo y ban
    await this.notifyOtherPartyAboutRejection(compliance);
  }

  // ============ MÉTODOS DE EMAIL ============

  /**
   * Notifica a la otra parte cuando un compliance es rechazado con consecuencias graves
   */
  private async notifyOtherPartyAboutRejection(
    compliance: ClaimCompliance,
  ): Promise<void> {
    try {
      const hiringTitle =
        compliance.claim?.hiring?.service?.title || 'Servicio sin título';

      const clientUserId = compliance.claim.hiring.userId;
      const providerUserId = compliance.claim.hiring.service?.userId;

      const otherPartyUserId =
        compliance.responsibleUserId === clientUserId.toString()
          ? providerUserId
          : clientUserId;

      const otherPartyUser =
        await this.usersClientService.getUserByIdWithRelations(
          otherPartyUserId,
        );

      if (otherPartyUser && otherPartyUser.email) {
        const otherPartyName =
          otherPartyUser.profile?.firstName ||
          otherPartyUser.profile?.name ||
          'Usuario';

        const complianceLabel = this.getComplianceTypeLabel(
          compliance.complianceType,
        );

        // Email informando que la otra parte no cumplió y ha sido sancionada
        await this.emailService.sendComplianceRejectedEmail(
          otherPartyUser.email,
          otherPartyName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle,
            rejectionReason: null, // No mostrar motivo a la otra parte
            rejectionCount: compliance.rejectionCount,
            isOtherPartyEmail: true,
            complianceLabel,
            isSecondRejection: compliance.rejectionCount === 2,
          },
        );
      }
    } catch (error) {
      console.error(
        '[ModeratorReview] Error notificando a la otra parte sobre rechazo:',
        error,
      );
    }
  }

  private async sendApprovalEmail(compliance: ClaimCompliance): Promise<void> {
    try {
      const responsibleUser =
        await this.usersClientService.getUserByIdWithRelations(
          Number(compliance.responsibleUserId),
        );

      const hiringTitle =
        compliance.claim?.hiring?.service?.title || 'Servicio sin título';

      // 1. EMAIL AL USUARIO RESPONSABLE
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
            hiringTitle,
            moderatorNotes: compliance.moderatorNotes,
          },
        );
      }

      // 2. EMAIL A LA OTRA PARTE (cliente o proveedor)
      const clientUserId = compliance.claim.hiring.userId;
      const providerUserId = compliance.claim.hiring.service?.userId;

      const otherPartyUserId =
        compliance.responsibleUserId === clientUserId.toString()
          ? providerUserId
          : clientUserId;

      const otherPartyUser =
        await this.usersClientService.getUserByIdWithRelations(
          otherPartyUserId,
        );

      if (otherPartyUser && otherPartyUser.email) {
        const otherPartyName =
          otherPartyUser.profile?.firstName ||
          otherPartyUser.profile?.name ||
          'Usuario';

        const responsibleUserName =
          responsibleUser?.profile?.firstName ||
          responsibleUser?.profile?.name ||
          'Usuario';

        // Email informando que la otra parte cumplió su compromiso
        await this.emailService.sendComplianceApprovedEmail(
          otherPartyUser.email,
          otherPartyName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle,
            moderatorNotes: `${responsibleUserName} ha cumplido con el compromiso acordado. ${compliance.moderatorNotes || ''}`,
          },
        );
      }
    } catch (error) {
      console.error(
        '[ModeratorReview] Error enviando email de aprobación:',
        error,
      );
    }
  }

  /**
   * Envía email cuando se requiere ajuste
   */
  private async sendAdjustmentEmail(
    compliance: ClaimCompliance,
  ): Promise<void> {
    try {
      const responsibleUser =
        await this.usersClientService.getUserByIdWithRelations(
          Number(compliance.responsibleUserId),
        );

      const hiringTitle =
        compliance.claim?.hiring?.service?.title || 'Servicio sin título';

      // 1. EMAIL AL USUARIO RESPONSABLE
      if (responsibleUser && responsibleUser.email) {
        const responsibleUserName =
          responsibleUser.profile?.firstName ||
          responsibleUser.profile?.name ||
          'Usuario';

        // Usar email de rechazo pero con mensaje de ajuste
        await this.emailService.sendComplianceRejectedEmail(
          responsibleUser.email,
          responsibleUserName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle,
            rejectionReason: `AJUSTE REQUERIDO (No cuenta como rechazo):\n\n${compliance.moderatorNotes}\n\nPuedes reenviar la evidencia sin consecuencias.`,
            rejectionCount: 0,
          },
        );
      }

      // 2. EMAIL A LA OTRA PARTE
      const clientUserId = compliance.claim.hiring.userId;
      const providerUserId = compliance.claim.hiring.service?.userId;

      const otherPartyUserId =
        compliance.responsibleUserId === clientUserId.toString()
          ? providerUserId
          : clientUserId;

      const otherPartyUser =
        await this.usersClientService.getUserByIdWithRelations(
          otherPartyUserId,
        );

      if (otherPartyUser && otherPartyUser.email) {
        const otherPartyName =
          otherPartyUser.profile?.firstName ||
          otherPartyUser.profile?.name ||
          'Usuario';

        const responsibleUserName =
          responsibleUser?.profile?.firstName ||
          responsibleUser?.profile?.name ||
          'Usuario';

        // Email informando que se requiere ajuste (no es rechazo)
        await this.emailService.sendComplianceRejectedEmail(
          otherPartyUser.email,
          otherPartyName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle,
            rejectionReason: `Se ha solicitado a ${responsibleUserName} que realice ajustes menores en la evidencia del compromiso. Esto no cuenta como rechazo.\n\nRazón: ${compliance.moderatorNotes}`,
            rejectionCount: 0,
          },
        );
      }
    } catch (error) {
      console.error('[ModeratorReview] Error enviando email de ajuste:', error);
    }
  }

  /**
   * Envía email de advertencia (primer rechazo)
   */
  private async sendWarningEmail(
    compliance: ClaimCompliance,
    dto: ModeratorReviewComplianceDto,
  ): Promise<void> {
    try {
      const responsibleUser =
        await this.usersClientService.getUserByIdWithRelations(
          Number(compliance.responsibleUserId),
        );

      const hiringTitle =
        compliance.claim?.hiring?.service?.title || 'Servicio sin título';

      const attemptsLeft =
        compliance.maxAttempts - compliance.currentAttempt + 1;

      // 1. EMAIL AL USUARIO RESPONSABLE
      if (responsibleUser && responsibleUser.email) {
        const responsibleUserName =
          responsibleUser.profile?.firstName ||
          responsibleUser.profile?.name ||
          'Usuario';

        const deadlineStr = compliance.deadline.toLocaleString('es-AR', {
          dateStyle: 'full',
          timeStyle: 'short',
        });

        const rejectionReasonText = dto.rejectionReason
          ? `Razón del rechazo: ${dto.rejectionReason}`
          : 'Tu evidencia no cumplió con los requisitos establecidos.';

        await this.emailService.sendComplianceRejectedEmail(
          responsibleUser.email,
          responsibleUserName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle,
            rejectionReason: `ADVERTENCIA - PRIMER RECHAZO\n\n${rejectionReasonText}\n\nNUEVO PLAZO: Tienes hasta el ${deadlineStr} (7 días) para volver a subir la evidencia corregida.\n\nTienes ${attemptsLeft} oportunidades más para corregir esto.\n\n⚠️ IMPORTANTE: Si vuelves a ser rechazado serás SUSPENDIDO por 15 días.\n\nPor favor, sube nueva evidencia que cumpla con los requisitos del moderador.`,
            rejectionCount: compliance.rejectionCount,
          },
        );
      }

      // 2. EMAIL A LA OTRA PARTE
      const clientUserId = compliance.claim.hiring.userId;
      const providerUserId = compliance.claim.hiring.service?.userId;

      const otherPartyUserId =
        compliance.responsibleUserId === clientUserId.toString()
          ? providerUserId
          : clientUserId;

      const otherPartyUser =
        await this.usersClientService.getUserByIdWithRelations(
          otherPartyUserId,
        );

      if (otherPartyUser && otherPartyUser.email) {
        const otherPartyName =
          otherPartyUser.profile?.firstName ||
          otherPartyUser.profile?.name ||
          'Usuario';

        const responsibleUserName =
          responsibleUser?.profile?.firstName ||
          responsibleUser?.profile?.name ||
          'Usuario';

        const complianceLabel = this.getComplianceTypeLabel(
          compliance.complianceType,
        );

        const rejectionReasonText = dto.rejectionReason
          ? `Razón: ${dto.rejectionReason}`
          : 'No cumplió con los requisitos establecidos.';

        // Email informando que se rechazó el compromiso de la otra parte
        await this.emailService.sendComplianceRejectedEmail(
          otherPartyUser.email,
          otherPartyName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle,
            rejectionReason: `El moderador ha rechazado la evidencia del compromiso de ${complianceLabel} enviada por ${responsibleUserName}.\n\n${rejectionReasonText}\n\nSe le ha dado una advertencia y tiene ${attemptsLeft} oportunidades más para corregirlo.`,
            rejectionCount: compliance.rejectionCount,
          },
        );
      }
    } catch (error) {
      console.error(
        '[ModeratorReview] Error enviando email de advertencia:',
        error,
      );
    }
  }

  /**
   * Envía email cuando se rechaza un compliance
   * (Para 2do y 3er rechazo, los emails de suspensión/ban se envían desde users microservice)
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
