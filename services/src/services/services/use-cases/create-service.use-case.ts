import { Injectable } from '@nestjs/common';
import { CreateServiceDto } from '../../dto/create-service.dto';
import { Service } from '../../entities/service.entity';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class CreateServiceUseCase {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(
    createServiceDto: CreateServiceDto,
    userId: number,
  ): Promise<Service> {
    const serviceData = {
      ...createServiceDto,
      userId,
      status: createServiceDto.status || 'active',
    };

    return await this.serviceRepository.create(serviceData);
  }
}
