import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import { CancelSubscriptionDto } from '../../dto/cancel-subscription.dto';
import { SubscriptionStatus } from '../../entities/membreship.entity';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { MercadoPagoService } from '../mercado-pago.service';

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly mercadoPagoService: MercadoPagoService,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async execute(userId: number, userEmail: string, dto: CancelSubscriptionDto) {
    try {
      const activeSubscription =
        await this.subscriptions.findActiveByUserId(userId);

      if (!activeSubscription) {
        throw new NotFoundException(
          'No tienes una suscripción activa para cancelar',
        );
      }

      const plan = activeSubscription.plan;
      const monthlyPrice = Number(plan.monthlyPrice);
      const annualPrice = Number(plan.annualPrice);
      const isFreePlan = monthlyPrice === 0 && annualPrice === 0;

      if (isFreePlan) {
        throw new BadRequestException(
          'No puedes cancelar el plan Free. Ya es gratuito.',
        );
      }

      if (
        activeSubscription.status === SubscriptionStatus.PENDING_CANCELLATION
      ) {
        throw new BadRequestException(
          'Esta suscripción ya tiene una cancelación pendiente',
        );
      }

      if (activeSubscription.status === SubscriptionStatus.CANCELLED) {
        throw new BadRequestException('Esta suscripción ya fue cancelada');
      }

      if (activeSubscription.mercadoPagoSubscriptionId) {
        try {
          await this.mercadoPagoService.cancelSubscription(
            activeSubscription.mercadoPagoSubscriptionId,
          );
        } catch (error) {
          console.error('Error al cancelar en MercadoPago:', error.message);
        }
      }

      const updatedSubscription = await this.subscriptions.update(
        activeSubscription.id,
        {
          status: SubscriptionStatus.PENDING_CANCELLATION,
          autoRenew: false,
          cancellationDate: new Date(),
          cancellationReason: dto.reason || null,
        },
      );

      if (!updatedSubscription) {
        throw new RpcException({
          status: 500,
          message: 'Error al actualizar la suscripción',
        });
      }

      this.sendCancellationEmail(
        userEmail,
        plan.name,
        activeSubscription.endDate,
      );

      return {
        success: true,
        message:
          'Cancelación programada exitosamente. Mantendrás los beneficios hasta el final del ciclo vigente.',
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          endDate: updatedSubscription.endDate,
          cancellationDate: updatedSubscription.cancellationDate,
          cancellationReason: updatedSubscription.cancellationReason,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw new RpcException({
          status: error.getStatus(),
          message: error.message,
        });
      }

      console.error('Error al cancelar suscripción:', error);
      throw new RpcException({
        status: 500,
        message: 'Error al procesar la cancelación de suscripción',
      });
    }
  }

  private sendCancellationEmail(
    userEmail: string,
    planName: string,
    endDate: Date | null,
  ): void {
    try {
      const formattedEndDate = endDate
        ? new Date(endDate).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'la fecha de finalización del ciclo';

      this.client.emit('send_email', {
        to: userEmail,
        subject: 'Cancelación de suscripción confirmada - Conexia',
        template: 'subscription-cancellation',
        context: {
          planName,
          endDate: formattedEndDate,
        },
      });
    } catch (error) {
      console.error('Error al enviar email de cancelación:', error);
    }
  }
}
