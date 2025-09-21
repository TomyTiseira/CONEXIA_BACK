import { Injectable } from '@nestjs/common';
import { CreateServiceDto, ServiceCategoryResponseDto } from '../dto';
import { CategoryService } from './category.service';
import { CreateServiceUseCase } from './use-cases/create-service.use-case';

@Injectable()
export class ServicesService {
  constructor(
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly categoryService: CategoryService,
  ) {}

  async createService(createServiceDto: CreateServiceDto, userId: number) {
    return this.createServiceUseCase.execute(createServiceDto, userId);
  }

  async getCategories(): Promise<ServiceCategoryResponseDto> {
    return this.categoryService.getCategories();
  }
}
