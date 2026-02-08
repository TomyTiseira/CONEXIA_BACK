import { Injectable } from '@nestjs/common';
import { MembershipsClientService } from '../../../common/services/memberships-client.service';
import { UsersClientService } from '../../../common/services/users-client.service';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { transformServicesWithOwners } from '../../../common/utils/service-transform.utils';
import { ServiceHiringRepository } from '../../../service-hirings/repositories/service-hiring.repository';
import { ServiceReviewRepository } from '../../../service-reviews/repositories/service-review.repository';
import { GetServicesDto } from '../../dto/get-services.dto';
import { Service } from '../../entities/service.entity';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class GetServicesUseCase {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly usersClientService: UsersClientService,
    private readonly serviceHiringRepository: ServiceHiringRepository,
    private readonly serviceReviewRepository: ServiceReviewRepository,
    private readonly membershipsClientService: MembershipsClientService,
  ) {}

  async execute(getServicesDto: GetServicesDto, currentUserId: number) {
    const params = {
      ...getServicesDto,
      page: getServicesDto.page || 1,
      limit: getServicesDto.limit || 12,
    };

    // 1. Obtener todos los servicios donde el usuario NO es dueño
    const [allServices] = await this.serviceRepository.findServicesWithFilters({
      ...params,
      page: 1,
      limit: 10000,
    });

    const notOwnerServices = allServices.filter(
      (s) => s.userId !== currentUserId,
    );

    // 2. Filtrar servicios de usuarios suspendidos o baneados usando ownerModerationStatus
    // Ya no necesitamos consultar NATS, el campo está denormalizado
    const activeOwnerServices = notOwnerServices.filter(
      (s) => !s.ownerModerationStatus, // null = owner activo
    );

    // 3. Obtener search_visibility de los dueños de los servicios
    const activeServiceOwnerIds = [
      ...new Set(activeOwnerServices.map((s) => s.userId)),
    ];
    const visibilityMap =
      await this.membershipsClientService.getUsersSearchVisibility(
        activeServiceOwnerIds,
      );

    // 4. Ordenar servicios por search_visibility del dueño
    const sortedServices = this.sortServicesBySearchVisibility(
      activeOwnerServices,
      visibilityMap,
    );

    // 5. Aplicar paginación sobre los servicios ya ordenados
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    const services = sortedServices.slice(start, end);

    // Obtener información de los dueños de los servicios
    const userIds = [...new Set(services.map((service) => service.userId))];
    const users = await this.usersClientService.getUsersByIds(userIds);

    // Obtener información de cotizaciones para los servicios
    const serviceIds = services.map((service) => service.id);
    const quotationInfo =
      await this.serviceHiringRepository.getQuotationInfoForServices(
        serviceIds,
        currentUserId,
      );

    // Obtener estadísticas de reseñas para los servicios en batch
    const reviewsInfo = new Map<
      number,
      { averageRating: number; totalReviews: number }
    >();
    if (serviceIds.length > 0) {
      const reviewsPromises = serviceIds.map(async (serviceId) => {
        const stats =
          await this.serviceReviewRepository.getServiceAverageRating(serviceId);
        return {
          serviceId,
          averageRating: stats.average,
          totalReviews: stats.count,
        };
      });
      const reviewsResults = await Promise.all(reviewsPromises);
      reviewsResults.forEach(({ serviceId, averageRating, totalReviews }) => {
        reviewsInfo.set(serviceId, { averageRating, totalReviews });
      });
    }

    // Transformar los servicios usando la función común
    const transformedServices = transformServicesWithOwners(
      services,
      users,
      currentUserId,
      quotationInfo,
      reviewsInfo,
    );

    // Calcular información de paginación usando solo los servicios donde no es dueño y el owner está activo
    const pagination = calculatePagination(activeOwnerServices.length, params);

    return {
      services: transformedServices,
      pagination,
    };
  }

  /**
   * Ordena servicios por search_visibility del dueño del servicio
   * Orden: prioridad_maxima > alta > estandar > sin valor
   */
  private sortServicesBySearchVisibility(
    services: Service[],
    visibilityMap: Map<number, string>,
  ): Service[] {
    const visibilityPriority: Record<string, number> = {
      prioridad_maxima: 3,
      alta: 2,
      estandar: 1,
    };

    return services.sort((a, b) => {
      const visibilityA = visibilityMap.get(a.userId);
      const visibilityB = visibilityMap.get(b.userId);

      const priorityA = visibilityA ? visibilityPriority[visibilityA] || 0 : 0;
      const priorityB = visibilityB ? visibilityPriority[visibilityB] || 0 : 0;

      // Ordenar de mayor a menor prioridad
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }

      // Si tienen la misma prioridad, ordenar por fecha de creación (más reciente primero)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}
