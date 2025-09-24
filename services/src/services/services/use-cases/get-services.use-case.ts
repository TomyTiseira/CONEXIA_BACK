import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { transformServicesWithOwners } from '../../../common/utils/service-transform.utils';
import { GetServicesDto } from '../../dto/get-services.dto';
import { Service } from '../../entities/service.entity';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class GetServicesUseCase {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly usersClientService: UsersClientService,
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

    // Transformar los servicios usando la función común
    const transformedServices = transformServicesWithOwners(
      services,
      users,
      currentUserId,
    );

    // Calcular información de paginación usando solo los servicios donde no es dueño
    const pagination = calculatePagination(notOwnerIds.length, params);

    return {
      services: transformedServices,
      pagination,
    };
  }
}