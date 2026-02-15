import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus } from '../../entities/membreship.entity';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { MercadoPagoService } from '../mercado-pago.service';

/**
 * Use case para procesar cancelaciones pendientes.
 * Se ejecuta diariamente para convertir suscripciones PENDING_CANCELLATION
 * a CANCELLED una vez que se cumple el endDate.
 *
 * TODO: Para habilitar el cron job:
 * 1. Instalar: npm install @nestjs/schedule
 * 2. Descomentar el import de @nestjs/schedule arriba
 * 3. Agregar ScheduleModule.forRoot() en app.module.ts
 * 4. Descomentar el decorador @Cron debajo
 * 5. Registrar este use case en membreships.module.ts
 */
@Injectable()
export class ProcessPendingCancellationsUseCase {
  private readonly logger = new Logger(ProcessPendingCancellationsUseCase.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  // TODO: Descomentar cuando se instale @nestjs/schedule
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async execute(): Promise<void> {
    try {
      this.logger.log('🕐 Iniciando proceso de cancelaciones pendientes...');

      const pendingCancellations =
        await this.subscriptionRepository.findPendingCancellations();

      if (pendingCancellations.length === 0) {
        this.logger.log('✅ No hay cancelaciones pendientes para procesar');
        return;
      }

      this.logger.log(
        `📋 Se encontraron ${pendingCancellations.length} cancelaciones pendientes`,
      );

      for (const subscription of pendingCancellations) {
        try {
          this.logger.log(
            `🔄 Procesando cancelación de suscripción ${subscription.id}`,
          );

          // Cancelar en MercadoPago si aún está activa
          if (subscription.mercadoPagoSubscriptionId) {
            try {
              await this.mercadoPagoService.cancelSubscription(
                subscription.mercadoPagoSubscriptionId,
              );
              this.logger.log(
                `✅ Suscripción ${subscription.mercadoPagoSubscriptionId} cancelada en MercadoPago`,
              );
            } catch (error) {
              this.logger.warn(
                `⚠️ No se pudo cancelar en MercadoPago (puede estar ya cancelada): ${error.message}`,
              );
              // Continuamos con la cancelación local
            }
          }

          // Actualizar a estado CANCELLED
          await this.subscriptionRepository.update(subscription.id, {
            status: SubscriptionStatus.CANCELLED,
            paymentStatus: 'cancelled',
          });

          this.logger.log(
            `✅ Suscripción ${subscription.id} finalizada (CANCELLED)`,
          );

          // TODO: Enviar notificación/email informando que la suscripción finalizó
          this.logger.log(
            `📧 Se debería enviar notificación de finalización al usuario ${subscription.userId}`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Error al procesar cancelación de suscripción ${subscription.id}:`,
            error.stack,
          );
          // Continuamos con las demás suscripciones
        }
      }

      this.logger.log(
        `✅ Proceso de cancelaciones pendientes completado. Procesadas: ${pendingCancellations.length}`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Error en el proceso de cancelaciones pendientes:',
        error.stack,
      );
    }
  }
}
