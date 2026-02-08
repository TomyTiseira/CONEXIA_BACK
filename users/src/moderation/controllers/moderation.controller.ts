import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ModerationService } from '../services/moderation.service';
import { BanManagementService } from '../services/ban-management.service';
import {
  SuspendForComplianceDto,
  BanForComplianceDto,
} from '../dto/compliance-violation.dto';

@Controller()
export class ModerationController {
  private readonly logger = new Logger(ModerationController.name);

  constructor(
    private readonly moderationService: ModerationService,
    private readonly banManagementService: BanManagementService,
  ) {}

  /**
   * Ejecuta el análisis de reportes manualmente
   */
  @MessagePattern('analyzeReports')
  async handleAnalyzeReports(@Payload() data: { triggeredBy: number }) {
    this.logger.log(
      `Recibida solicitud de análisis de reportes por usuario ${data.triggeredBy}`,
    );
    return await this.moderationService.analyzeReports(data.triggeredBy);
  }

  /**
   * Obtiene los resultados de los análisis con paginación
   */
  @MessagePattern('getModerationResults')
  async handleGetResults(
    @Payload()
    data: {
      page?: number;
      limit?: number;
      resolved?: boolean;
      classification?: string;
    },
  ) {
    return await this.moderationService.getResults(
      data.page || 1,
      data.limit || 10,
      data.resolved,
      data.classification,
    );
  }

  /**
   * Resuelve un análisis de moderación
   */
  @MessagePattern('resolveModerationAnalysis')
  async handleResolveAnalysis(
    @Payload()
    data: {
      analysisId: number;
      resolveDto: {
        action:
          | 'ban_user'
          | 'suspend_user'
          | 'release_user'
          | 'keep_monitoring';
        notes?: string;
        suspensionDays?: number;
      };
      moderatorId: number;
    },
  ) {
    this.logger.log(
      `Resolviendo análisis ${data.analysisId} con acción: ${data.resolveDto?.action}`,
    );
    return await this.moderationService.resolveAnalysis(
      data.analysisId,
      data.resolveDto?.action,
      data.moderatorId,
      data.resolveDto?.notes,
      data.resolveDto?.suspensionDays,
    );
  }

  /**
   * Obtiene los detalles completos de todos los reportes analizados
   */
  @MessagePattern('getAnalyzedReportsDetails')
  async handleGetAnalyzedReportsDetails(
    @Payload() data: { analysisId: number },
  ) {
    return await this.moderationService.getAnalyzedReportsDetails(
      data.analysisId,
    );
  }

  /**
   * 🧪 TESTING: Ejecuta manualmente el proceso de reactivación de suspensiones expiradas
   * Normalmente se ejecuta automáticamente a las 2 AM por el cron job
   */
  @MessagePattern('triggerReactivation')
  async handleTriggerReactivation(@Payload() data: { triggeredBy: number }) {
    this.logger.log(
      `Ejecución manual de reactivación solicitada por usuario ${data.triggeredBy}`,
    );
    return await this.moderationService.triggerManualReactivation();
  }

  /**
   * Suspende un usuario por violación de compliance
   */
  @MessagePattern('moderation.suspend_for_compliance')
  async handleSuspendForCompliance(@Payload() dto: SuspendForComplianceDto) {
    this.logger.log(
      `Suspendiendo usuario ${dto.userId} por violación de compliance ${dto.complianceId}`,
    );
    return await this.banManagementService.suspendForComplianceViolation(dto);
  }

  /**
   * Banea un usuario por violación de compliance
   */
  @MessagePattern('moderation.ban_for_compliance')
  async handleBanForCompliance(@Payload() dto: BanForComplianceDto) {
    this.logger.log(
      `Baneando usuario ${dto.userId} por violación de compliance ${dto.complianceId}`,
    );
    return await this.banManagementService.banForComplianceViolation(dto);
  }
}
