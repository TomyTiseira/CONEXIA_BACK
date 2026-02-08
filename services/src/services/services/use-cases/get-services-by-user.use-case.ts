import { Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../../common/exceptions/services.exceptions';
import { UsersClientService } from '../../../common/services/users-client.service';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { transformServicesWithOwners } from '../../../common/utils/service-transform.utils';
import { ServiceHiringRepository } from '../../../service-hirings/repositories/service-hiring.repository';
import { ServiceReviewRepository } from '../../../service-reviews/repositories/service-review.repository';
import { GetServicesByUserDto } from '../../dto/get-services-by-user.dto';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class GetServicesByUserUseCase {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly usersClientService: UsersClientService,
    private readonly serviceHiringRepository: ServiceHiringRepository,
    private readonly serviceReviewRepository: ServiceReviewRepository,
  ) {}

  async execute(data: GetServicesByUserDto) {
    // Obtener información del usuario propietario
    const users = await this.usersClientService.getUsersByIds([data.userId]);
    if (!users || users.length === 0) {
      throw new UserNotFoundException(data.userId);
    }

    // Configurar parámetros de paginación
    const params = {
      page: data.page || 1,
      limit: data.limit || 12,
    };

    // Obtener servicios del usuario con paginación
    const [services, total] = await this.serviceRepository.findByUserId(
      data.userId,
      data.includeInactive,
      params.page,
      params.limit,
    );

    // Obtener información de cotizaciones para los servicios
    const serviceIds = services.map((service) => service.id);
    const quotationInfo =
      await this.serviceHiringRepository.getQuotationInfoForServices(
        serviceIds,
        data.currentUserId,
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
      data.currentUserId,
      quotationInfo,
      reviewsInfo,
    );

    // Calcular información de paginación usando la función común
    const pagination = calculatePagination(total, params);

    return {
      services: transformedServices,
      pagination,
    };
  }
}
