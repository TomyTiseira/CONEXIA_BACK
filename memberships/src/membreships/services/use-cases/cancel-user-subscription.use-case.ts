import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionStatus } from '../../entities/membreship.entity';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { MercadoPagoService } from '../mercado-pago.service';

@Injectable()
export class CancelUserSubscriptionUseCase {
  private readonly logger = new Logger(CancelUserSubscriptionUseCase.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(
    userId: number,
    cancellationReason?: string,
  ): Promise<{
    success: boolean;
    message: string;
    subscription: {
      id: number;
      status: string;
      planId: number;
      planName: string;
      endDate: Date;
      cancellationDate: Date;
      cancellationReason: string | null;
      mercadoPagoSubscriptionId: string | null;
    };
  }> {
    try {
      this.logger.log(`🔴 Usuario ${userId} solicitó cancelar su suscripción`);

      // Buscar suscripción activa del usuario
      const activeSubscription =
        await this.subscriptionRepository.findActiveByUserId(userId);

      if (!activeSubscription) {
        this.logger.warn(`⚠️ Usuario ${userId} no tiene suscripción activa`);
        throw new NotFoundException('No tienes una suscripción activa');
      }

      // Verificar que no esté ya cancelada o con cancelación pendiente
      if (
        activeSubscription.status === SubscriptionStatus.CANCELLED ||
        activeSubscription.status === SubscriptionStatus.PENDING_CANCELLATION
      ) {
        this.logger.warn(
          `⚠️ La suscripción ${activeSubscription.id} ya está cancelada o con cancelación pendiente`,
        );
        throw new BadRequestException(
          'La suscripción ya está cancelada o con cancelación pendiente',
        );
      }

      this.logger.log(
        `📋 Suscripción encontrada: ID ${activeSubscription.id}, Plan: ${activeSubscription.plan.name}`,
      );

      // Cancelar en MercadoPago si tiene preapproval
      if (activeSubscription.mercadoPagoSubscriptionId) {
        try {
          await this.mercadoPagoService.cancelSubscription(
            activeSubscription.mercadoPagoSubscriptionId,
          );
          this.logger.log(
            `✅ Suscripción ${activeSubscription.mercadoPagoSubscriptionId} cancelada en MercadoPago`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Error al cancelar en MercadoPago: ${error.message}`,
          );
          // Continuamos con la cancelación local aunque falle en MP
        }
      }

      // Actualizar estado en la base de datos
      // La suscripción pasa a PENDING_CANCELLATION y mantiene el acceso
      // hasta el final del ciclo de facturación actual (endDate/nextPaymentDate)
      const cancellationDate = new Date();
      const endDate =
        activeSubscription.nextPaymentDate ||
        activeSubscription.endDate ||
        cancellationDate;

      await this.subscriptionRepository.update(activeSubscription.id, {
        status: SubscriptionStatus.PENDING_CANCELLATION,
        cancellationDate,
        cancellationReason: cancellationReason || null,
        endDate,
      });

      this.logger.log(
        `✅ Suscripción ${activeSubscription.id} marcada como PENDING_CANCELLATION. ` +
          `Beneficios activos hasta: ${endDate.toISOString()}`,
      );

      // TODO: Enviar correo/notificación confirmando la cancelación
      // e informando que mantiene los beneficios hasta el final del ciclo vigente
      this.logger.log(
        `📧 Se debería enviar notificación al usuario ${userId} confirmando cancelación`,
      );

      return {
        success: true,
        message:
          'Suscripción cancelada. Mantendrás los beneficios hasta el final del ciclo actual.',
        subscription: {
          id: activeSubscription.id,
          status: 'pending_cancellation',
          planId: activeSubscription.plan.id,
          planName: activeSubscription.plan.name,
          endDate,
          cancellationDate,
          cancellationReason: cancellationReason || null,
          mercadoPagoSubscriptionId:
            activeSubscription.mercadoPagoSubscriptionId,
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Error al cancelar suscripción del usuario ${userId}:`,
        error.stack,
      );
      throw error;
    }
  }
}
