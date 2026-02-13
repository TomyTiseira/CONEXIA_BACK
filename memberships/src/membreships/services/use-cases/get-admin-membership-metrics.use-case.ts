import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { NATS_SERVICE } from '../../../config';
import {
  Subscription,
  SubscriptionStatus,
} from '../../entities/membreship.entity';
import { Plan } from '../../entities/plan.entity';

export class UsersByPlanDto {
  planId: number;
  planName: string;
  usersCount: number;
}

export class MembershipsMetricsDto {
  usersByPlan: UsersByPlanDto[];
}

@Injectable()
export class GetAdminMembershipMetricsUseCase {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @Inject(NATS_SERVICE)
    private readonly natsClient: ClientProxy,
  ) {}

  async execute(): Promise<MembershipsMetricsDto> {
    try {
      // Obtener usuarios por plan (solo suscripciones activas)
      const usersByPlanRaw = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .select('subscription.planId', 'planId')
        .addSelect('plan.name', 'planName')
        .addSelect('COUNT(DISTINCT subscription.userId)', 'usersCount')
        .leftJoin(Plan, 'plan', 'plan.id = subscription.planId')
        .where('subscription.status = :status', {
          status: SubscriptionStatus.ACTIVE,
        })
        .groupBy('subscription.planId')
        .addGroupBy('plan.name')
        .getRawMany();

      const usersByPlan: UsersByPlanDto[] = usersByPlanRaw.map((item) => ({
        planId: parseInt(item.planId),
        planName: item.planName,
        usersCount: parseInt(item.usersCount),
      }));

      // Calcular usuarios con plan Free (usuarios generales sin suscripción activa)
      try {
        // Obtener total de usuarios generales (roleId = 2) desde users microservice
        const totalGeneralUsers = await firstValueFrom(
          this.natsClient.send<number>('getTotalGeneralUsers', {}),
        );

        // Contar usuarios con suscripción activa
        const usersWithActivePlan = await this.subscriptionRepository
          .createQueryBuilder('subscription')
          .select('COUNT(DISTINCT subscription.userId)', 'count')
          .where('subscription.status = :status', {
            status: SubscriptionStatus.ACTIVE,
          })
          .getRawOne();

        const freeUsersCount =
          totalGeneralUsers - parseInt(usersWithActivePlan.count || '0');

        // Agregar plan Free al inicio del array
        if (freeUsersCount > 0) {
          usersByPlan.unshift({
            planId: 0, // ID especial para plan Free
            planName: 'Free',
            usersCount: freeUsersCount,
          });
        }
      } catch (error) {
        console.error('Error calculating Free plan users:', error);
        // Si falla, continuar sin el plan Free
      }

      return {
        usersByPlan,
      };
    } catch (error) {
      console.error('Error getting admin membership metrics:', error);
      return {
        usersByPlan: [],
      };
    }
  }
}
