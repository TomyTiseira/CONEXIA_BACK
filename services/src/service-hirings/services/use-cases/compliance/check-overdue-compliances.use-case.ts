import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from '../../../../common/services/email.service';
import { UsersClientService } from '../../../../common/services/users-client.service';
import { ComplianceStatus } from '../../../enums/compliance.enum';
import { ClaimComplianceRepository } from '../../../repositories/claim-compliance.repository';
import { ClaimRepository } from '../../../repositories/claim.repository';
import { ComplianceConsequenceService } from '../../compliance-consequence.service';

/**
 * Use case para verificar compliances vencidos y aplicar consecuencias
 * Se ejecuta diariamente a las 2 AM
 */
@Injectable()
export class CheckOverdueCompliancesUseCase {
  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly consequenceService: ComplianceConsequenceService,
    private readonly emailService: EmailService,
    private readonly usersClientService: UsersClientService,
    private readonly claimRepository: ClaimRepository,
  ) {}

  /**
   * Cron job que se ejecuta diariamente a las 2 AM
   * para verificar compliances vencidos
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron(): Promise<void> {
    console.log(
      '[CheckOverdueCompliancesUseCase] Iniciando verificación de compliances vencidos...',
    );

    try {
      await this.checkOverdueCompliances();
    } catch (error) {
      console.error(
        '[CheckOverdueCompliancesUseCase] Error en cron job:',
        error,
      );
    }
  }

  /**
   * Método principal que verifica y procesa compliances vencidos
   * También puede ser llamado manualmente para testing
   */
  async checkOverdueCompliances(): Promise<void> {
    const now = new Date();

    // Buscar compliances que estén vencidos pero aún no escalados
    const overdueCompliances = await this.complianceRepository.findOverdue();

    console.log(
      `[CheckOverdueCompliancesUseCase] Encontrados ${overdueCompliances.length} compliances vencidos`,
    );

    for (const compliance of overdueCompliances) {
      try {
        // Determinar qué deadline verificar según el estado
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

        // Verificar si ya pasó el deadline correspondiente
        if (
          deadlineToCheck < now &&
          [
            ComplianceStatus.PENDING,
            ComplianceStatus.REQUIRES_ADJUSTMENT,
            ComplianceStatus.OVERDUE,
            ComplianceStatus.WARNING,
          ].includes(compliance.status)
        ) {
          console.log(
            `[CheckOverdueCompliancesUseCase] Procesando compliance vencido: ${compliance.id} (status: ${compliance.status}, deadline: ${deadlineToCheck.toISOString()})`,
          );

          // Aplicar consecuencias progresivas
          await this.consequenceService.applyConsequence(compliance);
        }
      } catch (error) {
        console.error(
          `[CheckOverdueCompliancesUseCase] Error procesando compliance ${compliance.id}:`,
          error,
        );
      }
    }

    console.log('[CheckOverdueCompliancesUseCase] Verificación completada');
  }

  /**
   * Envía recordatorios de compliances próximos a vencer
   * Se ejecuta diariamente a las 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async sendDeadlineReminders(): Promise<void> {
    console.log(
      '[CheckOverdueCompliancesUseCase] Enviando recordatorios de deadlines...',
    );

    try {
      // Buscar compliances que vencen en las próximas 24 horas
      const expiringSoon = await this.complianceRepository.findExpiringSoon();

      console.log(
        `[CheckOverdueCompliancesUseCase] ${expiringSoon.length} compliances próximos a vencer`,
      );

      for (const compliance of expiringSoon) {
        try {
          const claim = await this.claimRepository.findById(compliance.claimId);
          if (!claim) {
            console.error(
              `[CheckOverdueCompliancesUseCase] Claim no encontrado: ${compliance.claimId}`,
            );
            continue;
          }

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

          // Calcular horas restantes
          const now = new Date();
          const hoursRemaining = Math.floor(
            (compliance.deadline.getTime() - now.getTime()) / (1000 * 60 * 60),
          );

          // Enviar email de recordatorio
          await this.emailService.sendComplianceDeadlineWarningEmail(
            responsibleUser.email,
            responsibleUserName,
            {
              complianceId: compliance.id,
              complianceType: compliance.complianceType,
              claimId: compliance.claimId,
              hiringTitle: claim.hiring?.service?.title || 'Servicio',
              deadline: compliance.deadline,
              hoursRemaining,
              moderatorInstructions: compliance.moderatorInstructions,
            },
          );

          console.log(
            `[CheckOverdueCompliancesUseCase] Recordatorio enviado para compliance ${compliance.id} (${hoursRemaining}h restantes)`,
          );
        } catch (error) {
          console.error(
            `[CheckOverdueCompliancesUseCase] Error enviando recordatorio para compliance ${compliance.id}:`,
            error,
          );
        }
      }

      console.log('[CheckOverdueCompliancesUseCase] Recordatorios completados');
    } catch (error) {
      console.error(
        '[CheckOverdueCompliancesUseCase] Error enviando recordatorios:',
        error,
      );
    }
  }
}
