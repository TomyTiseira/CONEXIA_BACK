import { Injectable } from '@nestjs/common';
import { ServiceNotFoundException } from '../../../common/exceptions/services.exceptions';
import { UsersClientService } from '../../../common/services/users-client.service';
import { transformServicesWithOwners } from '../../../common/utils/service-transform.utils';
import { ServiceHiringRepository } from '../../../service-hirings/repositories/service-hiring.repository';
import { GetServiceByIdDto } from '../../dto/get-service-by-id.dto';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class GetServiceByIdUseCase {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly usersClientService: UsersClientService,
    private readonly serviceHiringRepository: ServiceHiringRepository,
  ) {}

  async execute(data: GetServiceByIdDto) {
    // Buscar el servicio con relaciones
    const service = await this.serviceRepository.findByIdWithRelations(data.id);

    if (!service) {
      throw new ServiceNotFoundException(data.id);
    }

    // Obtener información del dueño del servicio
    const users = await this.usersClientService.getUsersByIds([service.userId]);

    if (!users || users.length === 0) {
      throw new ServiceNotFoundException(data.id);
    }

    // Obtener información de cotizaciones para el servicio
    const quotationInfo =
      await this.serviceHiringRepository.getQuotationInfoForServices(
        [service.id],
        data.currentUserId,
      );

    // Obtener la cotización activa (service_hirings) para el usuario y el servicio
    const serviceHiring = await this.serviceHiringRepository.findActiveHiringByUserAndService(
      data.currentUserId,
      service.id,
    );

    // Transformar el servicio usando la función común
    const transformedServices = transformServicesWithOwners(
      [service],
      users,
      data.currentUserId,
      quotationInfo,
    );

    // Retornar el primer (y único) servicio transformado junto con la cotización activa
    return {
      ...transformedServices[0],
      serviceHiring,
    };
  }
}
