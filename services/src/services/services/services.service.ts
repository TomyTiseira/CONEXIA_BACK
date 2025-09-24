import { Injectable } from '@nestjs/common';
import {
    CreateServiceDto,
    GetServiceByIdDto,
    GetServicesByUserDto,
    GetServicesDto,
    ServiceCategoryResponseDto
} from '../dto';
import { CategoryService } from './category.service';
import { CreateServiceUseCase } from './use-cases/create-service.use-case';
import { GetServiceByIdUseCase } from './use-cases/get-service-by-id.use-case';
import { GetServicesByUserUseCase } from './use-cases/get-services-by-user.use-case';
import { GetServicesUseCase } from './use-cases/get-services.use-case';

@Injectable()
export class ServicesService {
  constructor(
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly getServicesUseCase: GetServicesUseCase,
    private readonly getServicesByUserUseCase: GetServicesByUserUseCase,
    private readonly getServiceByIdUseCase: GetServiceByIdUseCase,
    private readonly categoryService: CategoryService,
  ) {}

  async createService(createServiceDto: CreateServiceDto, userId: number) {
    return this.createServiceUseCase.execute(createServiceDto, userId);
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
