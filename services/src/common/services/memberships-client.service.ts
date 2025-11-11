/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';

@Injectable()
export class MembershipsClientService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * Obtiene el plan activo del usuario con sus beneficios
   * Si no tiene suscripción activa, devuelve el plan Free
   */
  async getUserPlan(userId: number): Promise<any> {
    try {
      const plan = await firstValueFrom(
        this.client.send('getUserPlan', { userId }),
      );
      return plan;
    } catch (error) {
      console.error('Error getting user plan:', error);
      return null;
    }
  }

  /**
   * Obtiene el valor de un beneficio específico del plan del usuario
   */
  async getUserBenefitValue(userId: number, benefitKey: string): Promise<any> {
    try {
      const plan = await this.getUserPlan(userId);
      if (!plan || !plan.benefits) {
        return null;
      }

      const benefit = plan.benefits.find((b: any) => b.key === benefitKey);
      return benefit?.value ?? null;
    } catch (error) {
      console.error(
        `Error getting benefit ${benefitKey} for user ${userId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Verifica si el usuario ha alcanzado el límite de servicios publicados
   * según su plan de suscripción
   */
  async canPublishService(
    userId: number,
    currentActiveServicesCount: number,
  ): Promise<{ canPublish: boolean; limit: number; current: number }> {
    try {
      const limit = await this.getUserBenefitValue(userId, 'publish_services');

      if (limit === null || limit === undefined) {
        // Si no se encuentra el beneficio, por defecto permitir
        return {
          canPublish: true,
          limit: 0,
          current: currentActiveServicesCount,
        };
      }

      const canPublish = currentActiveServicesCount < limit;

      return {
        canPublish,
        limit,
        current: currentActiveServicesCount,
      };
    } catch (error) {
      console.error('Error checking if user can publish service:', error);
      // En caso de error, permitir por defecto
      return {
        canPublish: true,
        limit: 0,
        current: currentActiveServicesCount,
      };
    }
  }

  /**
   * Obtiene el search_visibility de múltiples usuarios en batch
   * Retorna un Map con userId -> search_visibility
   */
  async getUsersSearchVisibility(
    userIds: number[],
  ): Promise<Map<number, string>> {
    const visibilityMap = new Map<number, string>();

    try {
      // Hacer las peticiones en paralelo (batch)
      const promises = userIds.map(async (userId) => {
        const visibility = await this.getUserBenefitValue(
          userId,
          'search_visibility',
        );
        return { userId, visibility };
      });

      const results = await Promise.all(promises);

      results.forEach(({ userId, visibility }) => {
        if (visibility) {
          visibilityMap.set(userId, visibility);
        }
      });

      return visibilityMap;
    } catch (error) {
      console.error('Error getting users search visibility:', error);
      return visibilityMap;
    }
  }
}
