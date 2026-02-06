import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import { SubscriptionStatus } from '../../entities/membreship.entity';
import { SubscriptionRepository } from '../../repository/subscription.repository';

@Injectable()
export class ProcessPendingCancellationsUseCase {
  private readonly logger = new Logger(ProcessPendingCancellationsUseCase.name);

  constructor(
    private readonly subscriptions: SubscriptionRepository,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async execute() {
    this.logger.log('Iniciando proceso de cancelaciones pendientes...');

    try {
      const pendingCancellations =
        await this.subscriptions.findPendingCancellations();

      if (pendingCancellations.length === 0) {
        this.logger.log('No hay suscripciones pendientes de cancelación');
        return {
          success: true,
          processedCount: 0,
          details: [],
        };
      }

      this.logger.log(
        `Encontradas ${pendingCancellations.length} suscripciones para cancelar`,
      );

      const processedDetails: Array<{
        subscriptionId: number;
        userId: number;
        status: string;
        message: string;
      }> = [];

      for (const subscription of pendingCancellations) {
        try {
          await this.subscriptions.update(subscription.id, {
            status: SubscriptionStatus.CANCELLED,
          });

          this.logger.log(
            `Suscripción ${subscription.id} cancelada exitosamente`,
          );

          const userInfo = await this.getUserInfo(subscription.userId);

          if (userInfo?.email) {
            this.sendCancellationCompletedEmail(
              userInfo.email,
              subscription.plan.name,
            );
          }

          processedDetails.push({
            subscriptionId: subscription.id,
            userId: subscription.userId,
            status: 'success',
            message: 'Suscripción cancelada exitosamente',
          });
        } catch (error) {
          this.logger.error(
            `Error al procesar suscripción ${subscription.id}:`,
            error.message,
          );

          processedDetails.push({
            subscriptionId: subscription.id,
            userId: subscription.userId,
            status: 'error',
            message: error.message,
          });
        }
      }

      const successCount = processedDetails.filter(
        (d) => d.status === 'success',
      ).length;

      this.logger.log(
        `Proceso completado. ${successCount}/${pendingCancellations.length} suscripciones canceladas`,
      );

      return {
        success: true,
        processedCount: successCount,
        details: processedDetails,
      };
    } catch (error) {
      this.logger.error('Error al procesar cancelaciones:', error.message);

      return {
        success: false,
        processedCount: 0,
        details: [
          {
            subscriptionId: 0,
            userId: 0,
            status: 'error',
            message: error.message,
          },
        ],
      };
    }
  }

  private async getUserInfo(userId: number): Promise<any> {
    try {
      return await this.client.send('getUserById', { id: userId }).toPromise();
    } catch (error) {
      this.logger.error(`Error al obtener usuario ${userId}:`, error.message);
      return null;
    }
  }

  private sendCancellationCompletedEmail(
    userEmail: string,
    planName: string,
  ): void {
    try {
      this.client.emit('send_email', {
        to: userEmail,
        subject: 'Tu suscripción ha sido cancelada - Conexia',
        template: 'subscription-cancelled-completed',
        context: {
          planName,
        },
      });
    } catch (error) {
      this.logger.error('Error al enviar email:', error);
    }
  }
}
