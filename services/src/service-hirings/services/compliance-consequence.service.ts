import { Injectable, Logger } from '@nestjs/common';
import { ClaimCompliance } from '../entities/claim-compliance.entity';
import { ComplianceStatus } from '../enums/compliance.enum';
import { ClaimComplianceRepository } from '../repositories/claim-compliance.repository';

/**
 * Servicio para aplicar consecuencias progresivas por incumplimientos
 */
@Injectable()
export class ComplianceConsequenceService {
  private readonly logger = new Logger(ComplianceConsequenceService.name);

  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
  ) {}

  /**
   * Aplica consecuencias progresivas a un cumplimiento vencido
   */
  async applyConsequence(
    compliance: ClaimCompliance,
  ): Promise<ClaimCompliance> {
    const currentLevel = compliance.warningLevel;

    this.logger.log(
      `Aplicando consecuencia nivel ${currentLevel + 1} a compliance ${compliance.id}`,
    );

    switch (currentLevel) {
      case 0:
        // Primera vez vencido: OVERDUE
        return this.applyOverdueConsequence(compliance);

      case 1:
        // Segunda vez vencido: WARNING
        return this.applyWarningConsequence(compliance);

      case 2:
        // Tercera vez vencido: ESCALATED
        return this.applyEscalatedConsequence(compliance);

      default:
        this.logger.warn(
          `Compliance ${compliance.id} ya está en nivel máximo de consecuencias`,
        );
        return compliance;
    }
  }

  /**
   * Primera consecuencia: OVERDUE
   * - Estado cambia a OVERDUE
   * - Se extiende deadline +50%
   * - Warning level = 1
   */
  private async applyOverdueConsequence(
    compliance: ClaimCompliance,
  ): Promise<ClaimCompliance> {
    const originalDeadline = compliance.deadline;
    const extensionDays = Math.ceil(compliance.originalDeadlineDays * 0.5);
    const extendedDeadline = new Date(originalDeadline);
    extendedDeadline.setDate(extendedDeadline.getDate() + extensionDays);

    compliance.status = ComplianceStatus.OVERDUE;
    compliance.warningLevel = 1;
    compliance.extendedDeadline = extendedDeadline;

    const saved = await this.complianceRepository.save(compliance);

    this.logger.log(
      `Compliance ${compliance.id} marcado como OVERDUE. Deadline extendido ${extensionDays} días hasta ${extendedDeadline.toISOString()}`,
    );

    // TODO: Enviar email de advertencia al usuario
    // await this.emailService.sendComplianceOverdueEmail(...)

    return saved;
  }

  /**
   * Segunda consecuencia: WARNING
   * - Estado cambia a WARNING
   * - Se extiende deadline +25% adicional
   * - Warning level = 2
   * - Se notifica al moderador
   */
  private async applyWarningConsequence(
    compliance: ClaimCompliance,
  ): Promise<ClaimCompliance> {
    const currentDeadline = compliance.extendedDeadline || compliance.deadline;
    const extensionDays = Math.ceil(compliance.originalDeadlineDays * 0.25);
    const finalDeadline = new Date(currentDeadline);
    finalDeadline.setDate(finalDeadline.getDate() + extensionDays);

    compliance.status = ComplianceStatus.WARNING;
    compliance.warningLevel = 2;
    compliance.finalDeadline = finalDeadline;

    const saved = await this.complianceRepository.save(compliance);

    this.logger.warn(
      `Compliance ${compliance.id} en WARNING crítico. Deadline final: ${finalDeadline.toISOString()}`,
    );

    // TODO: Enviar email crítico al usuario
    // TODO: Notificar al moderador
    // await this.emailService.sendComplianceWarningEmail(...)
    // await this.emailService.sendModeratorWarningNotification(...)

    return saved;
  }

  /**
   * Tercera consecuencia: ESCALATED
   * - Estado cambia a ESCALATED
   * - Warning level = 3
   * - Se prepara para aplicar sanciones (suspensión/ban)
   * - Se notifica a administradores
   */
  private async applyEscalatedConsequence(
    compliance: ClaimCompliance,
  ): Promise<ClaimCompliance> {
    compliance.status = ComplianceStatus.ESCALATED;
    compliance.warningLevel = 3;

    const saved = await this.complianceRepository.save(compliance);

    this.logger.error(
      `Compliance ${compliance.id} ESCALATED. Usuario ${compliance.responsibleUserId} debe ser sancionado`,
    );

    // TODO: Iniciar proceso de sanción
    // TODO: Notificar a administradores
    // TODO: Enviar email final al usuario
    // await this.sanctionService.initiateSanction(compliance.responsibleUserId, compliance)
    // await this.emailService.sendComplianceEscalatedEmail(...)
    // await this.emailService.sendAdminEscalationNotification(...)

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
