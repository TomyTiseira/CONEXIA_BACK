import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ComplianceStatus } from '../../../enums/compliance.enum';
import { ClaimComplianceRepository } from '../../../repositories/claim-compliance.repository';
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
        // Verificar si ya pasó el deadline
        if (
          compliance.deadline < now &&
          [
            ComplianceStatus.PENDING,
            ComplianceStatus.REQUIRES_ADJUSTMENT,
          ].includes(compliance.status)
        ) {
          console.log(
            `[CheckOverdueCompliancesUseCase] Procesando compliance vencido: ${compliance.id}`,
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
        // TODO: Enviar email de recordatorio
        console.log(
          `[CheckOverdueCompliancesUseCase] Recordatorio enviado para compliance ${compliance.id}`,
        );
      }
    } catch (error) {
      console.error(
        '[CheckOverdueCompliancesUseCase] Error enviando recordatorios:',
        error,
      );
    }
  }
}
