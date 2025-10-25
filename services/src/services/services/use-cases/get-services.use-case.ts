import { Injectable } from '@nestjs/common';
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

    const notOwnerIds = allServices
      .filter((s) => s.userId !== currentUserId)
      .map((s) => s.id);

    // 2. Paginar sobre esos IDs
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    const paginatedIds = notOwnerIds.slice(start, end);

    // 3. Traer los servicios completos con relaciones usando los IDs paginados
    let services: Service[] = [];
    if (paginatedIds.length > 0) {
      services = await this.serviceRepository.findServicesByIds(paginatedIds);
    }

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
          await this.serviceReviewRepository.getServiceAverageRating(
            serviceId,
          );
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

    // Calcular información de paginación usando solo los servicios donde no es dueño
    const pagination = calculatePagination(notOwnerIds.length, params);

    return {
      services: transformedServices,
      pagination,
    };
  }
}
