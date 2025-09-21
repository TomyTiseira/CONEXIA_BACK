import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategoryDto, ServiceCategoryResponseDto } from '../dto';
import { ServiceCategory } from '../entities';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categoryRepository: Repository<ServiceCategory>,
  ) {}

  async getCategories(): Promise<ServiceCategoryResponseDto> {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const categoryDtos: ServiceCategoryDto[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
    }));

    return {
      categories: categoryDtos,
    };
  }
}
