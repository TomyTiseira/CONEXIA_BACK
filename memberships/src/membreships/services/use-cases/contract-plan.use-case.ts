import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ContractPlanResponseDto } from '../../dto/contract-plan-response.dto';
import { ContractPlanDto } from '../../dto/contract-plan.dto';
import {
  BillingCycle,
  SubscriptionStatus,
} from '../../entities/membreship.entity';
import { PlanRepository } from '../../repository/plan.repository';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { MercadoPagoService } from '../mercado-pago.service';

@Injectable()
export class ContractPlanUseCase {
  private readonly logger = new Logger(ContractPlanUseCase.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(
    userId: number,
    userEmail: string,
    userRole: string,
    dto: ContractPlanDto,
  ): Promise<ContractPlanResponseDto> {
    try {
      this.logger.log(
        `Usuario ${userId} intentando contratar plan ${dto.planId}`,
      );

      // Validar que el usuario no sea admin o moderador
      if (userRole === 'admin' || userRole === 'moderator') {
        throw new ForbiddenException(
          'Los administradores y moderadores no pueden contratar planes',
        );
      }

      // Verificar que el plan existe y está activo
      const plan = await this.planRepository.findById(dto.planId);
      if (!plan) {
        throw new NotFoundException(`Plan con ID ${dto.planId} no encontrado`);
      }

      if (!plan.active) {
        throw new BadRequestException(
          'El plan seleccionado no está disponible',
        );
      }

      // Verificar si el usuario ya tiene una suscripción activa
      const activeSubscription =
        await this.subscriptionRepository.findActiveByUserId(userId);

      let replacesSubscriptionId: number | null = null;

      if (activeSubscription) {
        // Si ya tiene el mismo plan, no permitir
        if (
          activeSubscription.planId === dto.planId &&
          activeSubscription.billingCycle === dto.billingCycle
        ) {
          throw new BadRequestException(
            'Ya tienes una suscripción activa a este plan',
          );
        }

        // Si es upgrade/downgrade, marcar para reemplazo al finalizar ciclo actual
        this.logger.log(
          `Usuario ${userId} tiene suscripción activa ${activeSubscription.id}, se reemplazará al finalizar`,
        );
        replacesSubscriptionId = activeSubscription.id;
      }

      // Calcular precio según el ciclo de facturación
      const price =
        dto.billingCycle === BillingCycle.MONTHLY
          ? plan.monthlyPrice
          : plan.annualPrice;

      if (price <= 0) {
        throw new BadRequestException(
          `El plan no tiene precio configurado para el ciclo ${dto.billingCycle}`,
        );
      }

      // Verificar que el plan tenga configurado el plan de MercadoPago
      const mercadoPagoPlanId =
        dto.billingCycle === BillingCycle.MONTHLY
          ? plan.mercadoPagoPlanIdMonthly
          : plan.mercadoPagoPlanIdAnnual;

      if (!mercadoPagoPlanId) {
        throw new BadRequestException(
          `El plan no tiene configurado el plan de MercadoPago para el ciclo ${dto.billingCycle}`,
        );
      }

      // Crear suscripción en estado pendiente
      const subscription = await this.subscriptionRepository.create({
        userId,
        planId: dto.planId,
        billingCycle: dto.billingCycle,
        status: SubscriptionStatus.PENDING_PAYMENT,
        price,
        autoRenew: true,
        retryCount: 0,
        replacesSubscriptionId,
      });

      this.logger.log(
        `Suscripción ${subscription.id} creada en estado PENDING_PAYMENT`,
      );

      // Crear suscripción recurrente en MercadoPago
      const {
        subscriptionId: mpSubscriptionId,
        initPoint,
        status,
      } = this.mercadoPagoService.createSubscription(
        mercadoPagoPlanId,
        userEmail,
        subscription.id,
      );

      // En redirect flow, solo actualizamos si MercadoPago devuelve un subscriptionId
      // De lo contrario, esperamos el webhook después del pago
      if (mpSubscriptionId) {
        const calculatedNextPaymentDate =
          status === 'authorized'
            ? this.calculateNextPaymentDate(new Date(), dto.billingCycle)
            : null;

        await this.subscriptionRepository.update(subscription.id, {
          mercadoPagoSubscriptionId: mpSubscriptionId,
          paymentStatus: status,
          nextPaymentDate: calculatedNextPaymentDate,
          endDate: calculatedNextPaymentDate || undefined,
          status:
            status === 'authorized'
              ? SubscriptionStatus.ACTIVE
              : SubscriptionStatus.PENDING_PAYMENT,
          startDate: status === 'authorized' ? new Date() : undefined,
        });

        this.logger.log(
          `Suscripción ${subscription.id} vinculada a MercadoPago: ${mpSubscriptionId}`,
        );
      } else {
        this.logger.log(
          `Suscripción ${subscription.id} creada. Esperando pago del usuario y webhook de MercadoPago para activarla.`,
        );
      }

      // Calcular fecha de expiración de la preferencia (24 horas)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      return {
        success: true,
        message: activeSubscription
          ? 'Suscripción creada. Se activará al finalizar tu plan actual.'
          : 'Suscripción creada exitosamente. La renovación será automática.',
        data: {
          subscriptionId: subscription.id,
          mercadoPagoUrl: initPoint,
          mercadoPagoSubscriptionId: mpSubscriptionId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error al contratar plan: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new BadRequestException(
        'Error al procesar la contratación del plan',
      );
    }
  }

  private calculateNextPaymentDate(
    startDate: Date,
    billingCycle: BillingCycle,
  ): Date {
    const nextDate = new Date(startDate);

    if (billingCycle === BillingCycle.MONTHLY) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    return nextDate;
  }
}
