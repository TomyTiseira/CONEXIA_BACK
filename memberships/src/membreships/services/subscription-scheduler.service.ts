import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus } from '../entities/membreship.entity';
import { SubscriptionRepository } from '../repository/subscription.repository';

@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  /**
   * Cron job que se ejecuta todos los días a las 2 AM
   * Procesa las suscripciones con estado PENDING_CANCELLATION
   * y las cambia a CANCELLED cuando el ciclo de facturación ha terminado
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handlePendingCancellations() {
    this.logger.log('Ejecutando verificación de cancelaciones pendientes...');

    try {
      const cancelledCount = await this.processPendingCancellations();
      this.logger.log(
        `Verificación completada. ${cancelledCount} suscripciones canceladas.`,
      );
    } catch (error) {
      this.logger.error(
        'Error en la verificación de cancelaciones pendientes:',
        error,
      );
    }
  }

  /**
   * Encuentra y cancela todas las suscripciones pendientes de cancelación
   * cuyo endDate ya ha pasado
   * @returns Número de suscripciones canceladas
   */
  async processPendingCancellations(): Promise<number> {
    // Obtener suscripciones pendientes de cancelación cuyo endDate ya pasó
    const pendingCancellations =
      await this.subscriptionRepository.findPendingCancellations();

    this.logger.log(
      `Se encontraron ${pendingCancellations.length} suscripciones pendientes de cancelación.`,
    );

    let cancelledCount = 0;

    for (const subscription of pendingCancellations) {
      try {
        // Actualizar el estado a CANCELLED
        await this.subscriptionRepository.update(subscription.id, {
          status: SubscriptionStatus.CANCELLED,
        });

        cancelledCount++;

        this.logger.log(
          `Suscripción ${subscription.id} del usuario ${subscription.userId} cancelada exitosamente.`,
        );
      } catch (error) {
        this.logger.error(
          `Error al cancelar suscripción ${subscription.id}:`,
          error,
        );
      }
    }

    return cancelledCount;
  }
}
