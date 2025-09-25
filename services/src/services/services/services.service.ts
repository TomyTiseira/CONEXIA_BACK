import { Injectable } from '@nestjs/common';
import {
  CreateServiceDto,
  DeleteServiceDto,
  GetServiceByIdDto,
  GetServicesByUserDto,
  GetServicesDto,
  ServiceCategoryResponseDto,
  UpdateServiceDataDto,
} from '../dto';
import { CategoryService } from './category.service';
import { CreateServiceUseCase } from './use-cases/create-service.use-case';
import { DeleteServiceUseCase } from './use-cases/delete-service.use-case';
import { GetServiceByIdUseCase } from './use-cases/get-service-by-id.use-case';
import { GetServicesByUserUseCase } from './use-cases/get-services-by-user.use-case';
import { GetServicesUseCase } from './use-cases/get-services.use-case';
import { UpdateServiceUseCase } from './use-cases/update-service.use-case';

@Injectable()
export class ServicesService {
  constructor(
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly updateServiceUseCase: UpdateServiceUseCase,
    private readonly deleteServiceUseCase: DeleteServiceUseCase,
    private readonly getServicesUseCase: GetServicesUseCase,
    private readonly getServicesByUserUseCase: GetServicesByUserUseCase,
    private readonly getServiceByIdUseCase: GetServiceByIdUseCase,
    private readonly categoryService: CategoryService,
  ) {}

  async createService(createServiceDto: CreateServiceDto, userId: number) {
    return this.createServiceUseCase.execute(createServiceDto, userId);
  }

  async updateService(updateServiceDataDto: UpdateServiceDataDto) {
    return this.updateServiceUseCase.execute(
      updateServiceDataDto.serviceId,
      updateServiceDataDto.userId,
      {
        price: updateServiceDataDto.price,
        estimatedHours: updateServiceDataDto.estimatedHours,
      },
    );
  }

  async deleteService(deleteServiceDto: DeleteServiceDto) {
    return this.deleteServiceUseCase.execute(
      deleteServiceDto.serviceId,
      deleteServiceDto.reason,
      deleteServiceDto.userId,
    );
  }

  async getServices(getServicesDto: GetServicesDto, currentUserId: number) {
    return this.getServicesUseCase.execute(getServicesDto, currentUserId);
  }

  async getServicesByUser(data: GetServicesByUserDto) {
    return this.getServicesByUserUseCase.execute(data);
  }

  async getServiceById(data: GetServiceByIdDto) {
    return this.getServiceByIdUseCase.execute(data);
  }

  async getCategories(): Promise<ServiceCategoryResponseDto> {
    return this.categoryService.getCategories();
  }
}
