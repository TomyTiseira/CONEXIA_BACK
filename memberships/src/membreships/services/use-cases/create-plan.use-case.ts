import { Injectable, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import {
  BenefitNotFoundException,
  PlanBadRequestException,
  PlanMercadoPagoSyncException,
} from '../../../common/exceptions';
import { CreatePlanDto } from '../../dto/create-plan.dto';
import { BenefitRepository } from '../../repository/benefit.repository';
import { PlanLogRepository } from '../../repository/plan-log.repository';
import { PlanRepository } from '../../repository/plan.repository';
import { SyncPlanWithMercadoPagoUseCase } from './sync-plan-with-mercadopago.use-case';

@Injectable()
export class CreatePlanUseCase {
  private readonly logger = new Logger(CreatePlanUseCase.name);

  constructor(
    private readonly plans: PlanRepository,
    private readonly benefits: BenefitRepository,
    private readonly logs: PlanLogRepository,
    private readonly syncPlanWithMercadoPago: SyncPlanWithMercadoPagoUseCase,
  ) {}

  async execute(dto: CreatePlanDto) {
    if (dto.monthlyPrice < 0 || dto.annualPrice < 0) {
      throw new PlanBadRequestException('Prices must be positive numbers');
    }

    // validate benefit keys
    for (const b of dto.benefits ?? []) {
      const exists = await this.benefits.findByKey(b.key);
      if (!exists) throw new BenefitNotFoundException(b.key);
    }

    try {
      const created = await this.plans.create({
        name: dto.name,
        description: dto.description,
        monthlyPrice: dto.monthlyPrice,
        annualPrice: dto.annualPrice,
        benefits: dto.benefits,
        active: dto.active ?? true,
      });

      await this.logs.createLog({
        adminUserId: dto.adminUserId,
        action: 'create',
        changes: { id: created.id, ...dto },
      });

      // Sincronizar con MercadoPago de forma SÍNCRONA
      // Si falla, hacer rollback del plan creado
      try {
        await this.syncPlanWithMercadoPago.execute(created.id);
        this.logger.log(
          `Plan ${created.id} sincronizado con MercadoPago exitosamente`,
        );
      } catch (syncError) {
        this.logger.error(
          `Error al sincronizar plan ${created.id} con MercadoPago: ${syncError.message}`,
          syncError.stack,
        );

        // Rollback: eliminar permanentemente el plan creado
        await this.plans.hardDelete(created.id);
        this.logger.warn(
          `Plan ${created.id} eliminado permanentemente debido a fallo en sincronización con MercadoPago`,
        );

        // Determinar el mensaje de error específico
        let errorDetails = '';
        if (syncError.message.includes('Cannot pay an amount lower than')) {
          errorDetails =
            'Los precios deben ser mayores o iguales a $15 ARS para planes mensuales y anuales.';
        } else if (syncError.message.includes('Invalid value for back url')) {
          errorDetails =
            'La URL de retorno no está configurada correctamente. Contacta al administrador.';
        } else if (
          syncError.message.includes('access_token') ||
          syncError.message.includes('credentials')
        ) {
          errorDetails =
            'Credenciales de MercadoPago inválidas. Contacta al administrador.';
        }

        throw new PlanMercadoPagoSyncException(syncError.message, errorDetails);
      }

      return created;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        'code' in error.driverError &&
        error.driverError.code === '23505'
      ) {
        throw new PlanBadRequestException(
          `A plan with the name "${dto.name}" already exists`,
        );
      }
      throw error;
    }
  }
}
