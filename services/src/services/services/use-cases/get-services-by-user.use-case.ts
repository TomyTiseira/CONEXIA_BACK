import { Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../../common/exceptions/services.exceptions';
import { UsersClientService } from '../../../common/services/users-client.service';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { transformServicesWithOwners } from '../../../common/utils/service-transform.utils';
import { GetServicesByUserDto } from '../../dto/get-services-by-user.dto';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class GetServicesByUserUseCase {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly usersClientService: UsersClientService,
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

    // Transformar los servicios usando la función común
    const transformedServices = transformServicesWithOwners(
      services,
      users,
      data.currentUserId,
    );

    // Calcular información de paginación usando la función común
    const pagination = calculatePagination(total, params);

    return {
      services: transformedServices,
      pagination,
    };
  }
}
