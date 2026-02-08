import { Injectable } from '@nestjs/common';
import { ServiceLimitExceededException } from '../../../common/exceptions/services.exceptions';
import { MembershipsClientService } from '../../../common/services/memberships-client.service';
import { UsersClientService } from '../../../common/services/users-client.service';
import { CreateServiceDto } from '../../dto/create-service.dto';
import { Service } from '../../entities/service.entity';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class CreateServiceUseCase {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly usersClientService: UsersClientService,
    private readonly membershipsClientService: MembershipsClientService,
  ) {}

  async execute(
    createServiceDto: CreateServiceDto,
    userId: number,
  ): Promise<Service> {
    // Validar que el usuario esté verificado
    await this.usersClientService.validateUserIsVerified(userId);

    // Validar límite de servicios según el plan de suscripción
    const [activeServices] = await this.serviceRepository.findByUserId(
      userId,
      false,
      1,
      9999,
    );
    const activeServicesCount = activeServices.length;

    const { canPublish, limit, current } =
      await this.membershipsClientService.canPublishService(
        userId,
        activeServicesCount,
      );

    if (!canPublish) {
      throw new ServiceLimitExceededException(limit, current);
    }

    const serviceData = {
      ...createServiceDto,
      userId,
      status: createServiceDto.status || 'active',
    };

    return await this.serviceRepository.create(serviceData);
  }
}
