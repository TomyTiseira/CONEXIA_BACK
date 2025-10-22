import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { CreateServiceDto } from '../../dto/create-service.dto';
import { Service } from '../../entities/service.entity';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class CreateServiceUseCase {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(
    createServiceDto: CreateServiceDto,
    userId: number,
  ): Promise<Service> {
    // Validar que el usuario esté verificado
    await this.usersClientService.validateUserIsVerified(userId);

    const serviceData = {
      ...createServiceDto,
      userId,
      status: createServiceDto.status || 'active',
    };

    return await this.serviceRepository.create(serviceData);
  }
}
