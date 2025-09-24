import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../entities/service.entity';

@Injectable()
export class ServiceRepository {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(data: Partial<Service>): Promise<Service> {
    const service = this.serviceRepository.create(data);
    return this.serviceRepository.save(service);
  }

  async findById(id: number): Promise<Service | null> {
    return this.serviceRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async findByIdWithRelations(id: number): Promise<Service | null> {
    return this.serviceRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async findServicesWithFilters(filters: {
    search?: string;
    categoryIds?: number[];
    page: number;
    limit: number;
  }): Promise<[Service[], number]> {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      .where('service.status = :status', { status: 'active' });

    if (filters.search) {
      queryBuilder.andWhere(
        '(service.title ILIKE :search OR service.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      queryBuilder.andWhere('service.categoryId IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }

    queryBuilder.orderBy('service.createdAt', 'DESC');

    const skip = (filters.page - 1) * filters.limit;
    queryBuilder.skip(skip).take(filters.limit);

    return queryBuilder.getManyAndCount();
  }

  async findByUserId(
    userId: number,
    includeInactive: boolean = false,
    page: number = 1,
    limit: number = 12,
  ): Promise<[Service[], number]> {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      .where('service.userId = :userId', { userId });

    // Incluir servicios inactivos si se solicita
    if (!includeInactive) {
      queryBuilder.andWhere('service.status = :status', { status: 'active' });
    }

    // Aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit).orderBy('service.createdAt', 'DESC');

    return queryBuilder.getManyAndCount();
  }

  async findServicesByIds(serviceIds: number[]): Promise<Service[]> {
    return this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      .where('service.id IN (:...serviceIds)', { serviceIds })
      .orderBy('service.createdAt', 'DESC')
      .getMany();
  }

  async update(id: number, data: Partial<Service>): Promise<void> {
    await this.serviceRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.serviceRepository.delete(id);
  }
}
