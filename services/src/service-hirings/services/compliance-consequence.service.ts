import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../common/services/email.service';
import { UsersClientService } from '../../common/services/users-client.service';
import { ClaimCompliance } from '../entities/claim-compliance.entity';
import { ComplianceStatus } from '../enums/compliance.enum';
import { ClaimComplianceRepository } from '../repositories/claim-compliance.repository';
import { ClaimRepository } from '../repositories/claim.repository';

/**
 * Servicio para aplicar consecuencias progresivas por incumplimientos
 */
@Injectable()
export class ComplianceConsequenceService {
  private readonly logger = new Logger(ComplianceConsequenceService.name);

  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly emailService: EmailService,
    private readonly usersClientService: UsersClientService,
    private readonly claimRepository: ClaimRepository,
  ) {}

  /**
   * Aplica consecuencias progresivas a un cumplimiento vencido
   * FLUJO CORRECTO:
   * - Día 0 (vencimiento): Email de advertencia + 3 días adicionales
   * - Día 3 vencido: Suspensión 15 días + 2 días adicionales para cumplir
   * - Día 5 vencido: Baneo permanente
   */
  async applyConsequence(
    compliance: ClaimCompliance,
  ): Promise<ClaimCompliance> {
    const now = new Date();

    // Determinar qué deadline usar para calcular días vencidos según el estado actual
    let deadlineToCheck: Date;
    if (
      compliance.status === ComplianceStatus.WARNING &&
      compliance.finalDeadline
    ) {
      deadlineToCheck = compliance.finalDeadline;
    } else if (
      compliance.status === ComplianceStatus.OVERDUE &&
      compliance.extendedDeadline
    ) {
      deadlineToCheck = compliance.extendedDeadline;
    } else {
      deadlineToCheck = compliance.deadline;
    }

    const daysOverdue = Math.floor(
      (now.getTime() - deadlineToCheck.getTime()) / (1000 * 60 * 60 * 24),
    );

    this.logger.log(
      `Aplicando consecuencia a compliance ${compliance.id} - Días vencido desde ${compliance.status === ComplianceStatus.WARNING ? 'finalDeadline' : compliance.status === ComplianceStatus.OVERDUE ? 'extendedDeadline' : 'deadline'}: ${daysOverdue}, warningLevel actual: ${compliance.warningLevel}, status: ${compliance.status}`,
    );

    // VALIDACIÓN: Si el warningLevel no coincide con el status, resetear
    if (
      (compliance.warningLevel === 1 &&
        compliance.status !== ComplianceStatus.OVERDUE) ||
      (compliance.warningLevel === 2 &&
        compliance.status !== ComplianceStatus.WARNING) ||
      (compliance.warningLevel === 3 &&
        compliance.status !== ComplianceStatus.ESCALATED)
    ) {
      this.logger.warn(
        `Compliance ${compliance.id} tiene datos inconsistentes (warningLevel: ${compliance.warningLevel}, status: ${compliance.status}). Reseteando warningLevel a 0.`,
      );
      compliance.warningLevel = 0;
      await this.complianceRepository.save(compliance);
    }

    // DÍA 0-2: Primera advertencia + 3 días
    if (daysOverdue >= 0 && daysOverdue < 3 && compliance.warningLevel === 0) {
      this.logger.log(
        `Compliance ${compliance.id} cumple condiciones para PRIMERA ADVERTENCIA`,
      );
      return this.applyFirstOverdueWarning(compliance);
    }

    // DÍA 3-4: Suspensión + 2 días adicionales (o si warningLevel=1 y está vencido)
    if (
      (daysOverdue >= 3 && daysOverdue < 5 && compliance.warningLevel === 1) ||
      (daysOverdue >= 0 &&
        compliance.warningLevel === 1 &&
        compliance.status === ComplianceStatus.OVERDUE)
    ) {
      this.logger.log(
        `Compliance ${compliance.id} cumple condiciones para SUSPENSIÓN`,
      );
      return this.applySuspensionAndFinalWarning(compliance);
    }

    // DÍA 5+: Baneo permanente (o si warningLevel=2 y finalDeadline está vencido)
    if (
      (daysOverdue >= 5 && compliance.warningLevel === 2) ||
      (daysOverdue >= 0 &&
        compliance.warningLevel === 2 &&
        compliance.status === ComplianceStatus.WARNING)
    ) {
      this.logger.log(
        `Compliance ${compliance.id} cumple condiciones para BANEO`,
      );
      return this.applyPermanentBan(compliance);
    }

    this.logger.warn(
      `Compliance ${compliance.id} NO cumple condiciones para ninguna acción. Días vencido: ${daysOverdue}, warningLevel: ${compliance.warningLevel}`,
    );
    return compliance;
  }

  /**
   * PRIMERA ADVERTENCIA (Día 0-2 vencido)
   * - Email de advertencia al usuario responsable
   * - Extensión de 3 días para cumplir
   * - Warning level = 1
   * - Estado cambia a OVERDUE
   */
  private async applyFirstOverdueWarning(
    compliance: ClaimCompliance,
  ): Promise<ClaimCompliance> {
    // Calcular nuevo deadline agregando 3 días a la fecha actual
    const now = new Date();
    const newDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 días en milisegundos

    compliance.status = ComplianceStatus.OVERDUE;
    compliance.warningLevel = 1;
    compliance.extendedDeadline = newDeadline;

    const saved = await this.complianceRepository.save(compliance);

    this.logger.warn(
      `Compliance ${compliance.id} VENCIDO - Primera advertencia. Nuevo plazo: ${newDeadline.toISOString()}`,
    );

    // Enviar emails
    try {
      this.logger.log(
        `Buscando claim ${compliance.claimId} para enviar emails...`,
      );
      const claim = await this.claimRepository.findById(compliance.claimId);
      if (!claim) {
        this.logger.error(
          `Claim no encontrado para compliance ${compliance.id}`,
        );
        return saved;
      }

      this.logger.log(`Claim encontrado. Buscando usuario responsable...`);
      const responsibleUser = await this.usersClientService.getUserById(
        parseInt(compliance.responsibleUserId, 10),
      );
      const responsibleFirstName =
        responsibleUser?.profile?.firstName ||
        responsibleUser?.profile?.name ||
        'Usuario';
      const responsibleLastName = responsibleUser?.profile?.lastName || '';
      const responsibleUserName =
        `${responsibleFirstName} ${responsibleLastName}`.trim();

      this.logger.log(
        `Enviando email de primera advertencia a ${responsibleUser.email}...`,
      );
      // Email al usuario responsable
      await this.emailService.sendComplianceOverdueEmail(
        responsibleUser.email,
        responsibleUserName,
        {
          complianceId: compliance.id,
          complianceType: compliance.complianceType,
          claimId: compliance.claimId,
          hiringTitle: claim.hiring?.service?.title || 'Servicio',
          originalDeadline: compliance.deadline,
          extendedDeadline: newDeadline,
          daysExtended: 3,
          moderatorInstructions: compliance.moderatorInstructions,
        },
      );

      this.logger.log(`Email de primera advertencia enviado exitosamente`);

      // Notificar a la otra parte
      const responsibleUserIdNumber = parseInt(
        compliance.responsibleUserId,
        10,
      );
      const otherPartyId =
        claim.claimantUserId === responsibleUserIdNumber
          ? claim.defendantUserId
          : claim.claimantUserId;
      if (otherPartyId) {
        this.logger.log(
          `Enviando notificación a la otra parte (user ${otherPartyId})...`,
        );
        const otherParty =
          await this.usersClientService.getUserById(otherPartyId);
        const otherPartyFirstName =
          otherParty?.profile?.firstName ||
          otherParty?.profile?.name ||
          'Usuario';
        const otherPartyLastName = otherParty?.profile?.lastName || '';
        const otherPartyName =
          `${otherPartyFirstName} ${otherPartyLastName}`.trim();

        await this.emailService.sendComplianceNonComplianceNotification(
          otherParty.email,
          otherPartyName,
          responsibleUserName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle: claim.hiring?.service?.title || 'Servicio',
            warningLevel: 1,
          },
        );
        this.logger.log(`Notificación a la otra parte enviada exitosamente`);
      }

      this.logger.log(
        `Proceso de emails completado para compliance ${compliance.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error enviando emails para compliance OVERDUE ${compliance.id}:`,
        error.stack || error,
      );
    }

    return saved;
  }

  /**
   * SUSPENSIÓN (Día 3-4 vencido)
   * - Suspensión del usuario por 15 días
   * - Email crítico al usuario
   * - Extensión de 2 días MÁS para cumplir (última oportunidad)
   * - Warning level = 2
   * - Estado cambia a WARNING
   */
  private async applySuspensionAndFinalWarning(
    compliance: ClaimCompliance,
  ): Promise<ClaimCompliance> {
    // Calcular deadline final agregando 2 días a la fecha actual
    const now = new Date();
    const finalDeadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 días en milisegundos

    compliance.status = ComplianceStatus.WARNING;
    compliance.warningLevel = 2;
    compliance.finalDeadline = finalDeadline;

    const saved = await this.complianceRepository.save(compliance);

    this.logger.error(
      `Compliance ${compliance.id} - SUSPENSIÓN aplicada. Plazo final: ${finalDeadline.toISOString()}`,
    );

    try {
      const claim = await this.claimRepository.findById(compliance.claimId);
      if (!claim) {
        this.logger.error(
          `Claim no encontrado para compliance ${compliance.id}`,
        );
        return saved;
      }

      const responsibleUser = await this.usersClientService.getUserById(
        parseInt(compliance.responsibleUserId, 10),
      );
      const responsibleUserFirstName =
        responsibleUser?.profile?.firstName ||
        responsibleUser?.profile?.name ||
        'Usuario';
      const responsibleUserLastName = responsibleUser?.profile?.lastName || '';
      const responsibleUserName =
        `${responsibleUserFirstName} ${responsibleUserLastName}`.trim();

      // SUSPENDER USUARIO por 15 días
      try {
        await this.usersClientService.suspendUserForComplianceViolation({
          userId: parseInt(compliance.responsibleUserId, 10),
          complianceId: compliance.id,
          reason: 'Incumplimiento de compromiso - Plazo vencido por 3 días',
          days: 15,
          moderatorId: claim.assignedModeratorId?.toString() || 'system',
        });
        this.logger.log(
          `Usuario ${compliance.responsibleUserId} suspendido por 15 días`,
        );
      } catch (suspensionError) {
        // La suspensión puede fallar si el microservicio no responde,
        // pero esto no debe detener el envío de emails
        this.logger.error(
          'Error suspending user for compliance violation:',
          suspensionError,
        );
      }

      // Email crítico al usuario responsable
      this.logger.log(
        `Enviando email de advertencia crítica a ${responsibleUser.email}...`,
      );
      await this.emailService.sendComplianceWarningEmail(
        responsibleUser.email,
        responsibleUserName,
        {
          complianceId: compliance.id,
          complianceType: compliance.complianceType,
          claimId: compliance.claimId,
          hiringTitle: claim.hiring?.service?.title || 'Servicio',
          finalDeadline,
          moderatorInstructions: compliance.moderatorInstructions,
        },
      );
      this.logger.log(
        `Email de advertencia crítica enviado exitosamente a ${responsibleUser.email}`,
      );

      // Notificar a la otra parte
      const responsibleUserIdNumber = parseInt(
        compliance.responsibleUserId,
        10,
      );
      const otherPartyId =
        claim.claimantUserId === responsibleUserIdNumber
          ? claim.defendantUserId
          : claim.claimantUserId;
      if (otherPartyId) {
        const otherParty =
          await this.usersClientService.getUserById(otherPartyId);
        const otherPartyFirstName =
          otherParty?.profile?.firstName ||
          otherParty?.profile?.name ||
          'Usuario';
        const otherPartyLastName = otherParty?.profile?.lastName || '';
        const otherPartyName =
          `${otherPartyFirstName} ${otherPartyLastName}`.trim();

        await this.emailService.sendComplianceNonComplianceNotification(
          otherParty.email,
          otherPartyName,
          responsibleUserName,
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle: claim.hiring?.service?.title || 'Servicio',
            warningLevel: 2,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `Error aplicando suspensión para compliance ${compliance.id}:`,
        error,
      );
    }

    return saved;
  }

  /**
   * BANEO PERMANENTE (Día 5+ vencido)
   * - Baneo permanente del usuario
   * - Email final al usuario
   * - Notificación a la otra parte
   * - Warning level = 3
   * - Estado cambia a ESCALATED
   */
  private async applyPermanentBan(
    compliance: ClaimCompliance,
  ): Promise<ClaimCompliance> {
    compliance.status = ComplianceStatus.ESCALATED;
    compliance.warningLevel = 3;

    const saved = await this.complianceRepository.save(compliance);

    this.logger.error(
      `Compliance ${compliance.id} - BANEO PERMANENTE aplicado al usuario ${compliance.responsibleUserId}`,
    );

    const claim = await this.claimRepository.findById(compliance.claimId);
    if (!claim) {
      this.logger.error(`Claim no encontrado para compliance ${compliance.id}`);
      return saved;
    }

    const responsibleUser = await this.usersClientService.getUserById(
      parseInt(compliance.responsibleUserId, 10),
    );
    const responsibleUserFirstName =
      responsibleUser?.profile?.firstName ||
      responsibleUser?.profile?.name ||
      'Usuario';
    const responsibleUserLastName = responsibleUser?.profile?.lastName || '';
    const responsibleUserName =
      `${responsibleUserFirstName} ${responsibleUserLastName}`.trim();

    // BANEAR USUARIO PERMANENTEMENTE
    try {
      await this.usersClientService.banUserForComplianceViolation({
        userId: parseInt(compliance.responsibleUserId, 10),
        complianceId: compliance.id,
        reason: 'Incumplimiento grave de compromiso - Plazo vencido por 5 días',
        moderatorId: claim.assignedModeratorId?.toString() || 'system',
      });

      this.logger.log(
        `Usuario ${compliance.responsibleUserId} baneado permanentemente`,
      );
    } catch (banError) {
      // El baneo puede fallar si el microservicio no responde,
      // pero esto no debe detener el envío de emails
      this.logger.error(
        'Error banning user for compliance violation:',
        banError,
      );
    }

    // Email final al usuario baneado
    this.logger.log(
      `Enviando email de baneo permanente a ${responsibleUser.email}...`,
    );
    await this.emailService.sendComplianceEscalatedEmail(
      responsibleUser.email,
      responsibleUserName,
      {
        complianceId: compliance.id,
        complianceType: compliance.complianceType,
        claimId: compliance.claimId,
        hiringTitle: claim.hiring?.service?.title || 'Servicio',
        moderatorInstructions: compliance.moderatorInstructions,
        deadline: compliance.deadline,
        extendedDeadline: compliance.extendedDeadline || undefined,
        finalDeadline: compliance.finalDeadline || undefined,
      },
    );
    this.logger.log(
      `Email de baneo permanente enviado exitosamente a ${responsibleUser.email}`,
    );

    // Notificar a la otra parte del reclamo sobre el baneo
    const responsibleUserIdNumber = parseInt(compliance.responsibleUserId, 10);
    const otherPartyId =
      claim.claimantUserId === responsibleUserIdNumber
        ? claim.defendantUserId
        : claim.claimantUserId;
    if (otherPartyId) {
      const otherParty =
        await this.usersClientService.getUserById(otherPartyId);
      const otherPartyName =
        `${otherParty?.profile?.firstName || ''} ${otherParty?.profile?.lastName || ''}`.trim() ||
        'Usuario';

      this.logger.log(
        `Enviando notificación de baneo a la otra parte: ${otherParty.email}...`,
      );
      await this.emailService.sendComplianceNonComplianceNotification(
        otherParty.email,
        otherPartyName,
        responsibleUserName,
        {
          complianceId: compliance.id,
          complianceType: compliance.complianceType,
          claimId: compliance.claimId,
          hiringTitle: claim.hiring?.service?.title || 'Servicio',
          warningLevel: 3,
          moderatorInstructions: compliance.moderatorInstructions,
        },
      );
      this.logger.log(
        `Notificación de baneo enviada exitosamente a ${otherParty.email}`,
      );
    }

    return saved;
  }

  /**
   * Calcula el próximo deadline según el nivel de warning
   */
  getNextDeadline(compliance: ClaimCompliance): Date | null {
    if (compliance.finalDeadline) {
      return compliance.finalDeadline;
    }
    if (compliance.extendedDeadline) {
      return compliance.extendedDeadline;
    }
    return compliance.deadline;
  }

  /**
   * Verifica si un compliance está en estado crítico
   */
  isCritical(compliance: ClaimCompliance): boolean {
    return compliance.warningLevel >= 2;
  }

  /**
   * Obtiene el número de días restantes para un compliance
   */
  getDaysRemaining(compliance: ClaimCompliance): number {
    const deadline = this.getNextDeadline(compliance);
    if (!deadline) return 0;

    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Reinicia las consecuencias cuando el usuario cumple exitosamente
   */
  async resetConsequences(compliance: ClaimCompliance): Promise<void> {
    if (compliance.warningLevel > 0) {
      this.logger.log(
        `Reiniciando consecuencias para compliance ${compliance.id} (usuario cumplió)`,
      );

      compliance.warningLevel = 0;
      compliance.extendedDeadline = null;
      compliance.finalDeadline = null;

      await this.complianceRepository.save(compliance);
    }
  }
}
