import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessPendingCancellationsUseCase } from './use-cases/process-pending-cancellations.use-case';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    private readonly processPendingCancellationsUC: ProcessPendingCancellationsUseCase,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handlePendingCancellations() {
    this.logger.log('[CRON] Iniciando proceso de cancelaciones pendientes');

    try {
      const result = await this.processPendingCancellationsUC.execute();

      if (result.success) {
        this.logger.log(
          `[CRON] Proceso completado. Cancelaciones procesadas: ${result.processedCount}`,
        );
      } else {
        this.logger.error('[CRON] El proceso finalizó con errores');
      }
    } catch (error) {
      this.logger.error(`[CRON] Error crítico: ${error.message}`, error.stack);
    }
  }
}
