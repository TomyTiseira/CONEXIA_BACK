import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
      where: { id, deletedAt: IsNull() },
      relations: ['category'],
    });
  }

  async findByIdIncludingDeleted(id: number): Promise<Service | null> {
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
    minRating?: number;
    page: number;
    limit: number;
  }): Promise<[Service[], number]> {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      // LEFT JOIN con service_reviews para calcular el promedio de calificaciones
      .leftJoin(
        'service_reviews',
        'review',
        'review.serviceId = service.id AND review.deletedAt IS NULL',
      )
      .where('service.status = :status', { status: 'active' })
      .andWhere('service.deletedAt IS NULL')
      .andWhere('service.status != :finishedByModeration', {
        finishedByModeration: 'finished_by_moderation',
      });

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

    // Agrupar por servicio para poder aplicar HAVING con el promedio de rating
    queryBuilder.groupBy('service.id').addGroupBy('category.id');

    // Si hay filtro de calificación mínima, aplicar HAVING
    if (filters.minRating !== undefined && filters.minRating > 0) {
      queryBuilder.having('COALESCE(AVG(review.rating), 0) >= :minRating', {
        minRating: filters.minRating,
      });
    }

    // Ordenar por fecha de creación (más recientes primero)
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

    if (includeInactive) {
      // Incluir servicios activos y dados de baja (deleted)
      queryBuilder.andWhere('service.status IN (:...statuses)', {
        statuses: ['active', 'deleted'],
      });
    } else {
      // Solo servicios activos (no dados de baja)
      queryBuilder
        .andWhere('service.deletedAt IS NULL')
        .andWhere('service.status = :status', { status: 'active' });
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

  async updateService(
    service: Service,
    updates: Partial<Service>,
  ): Promise<Service> {
    Object.assign(service, updates);
    return this.serviceRepository.save(service);
  }

  async deleteService(service: Service, reason: string): Promise<void> {
    service.deletedAt = new Date();
    service.deleteReason = reason;
    service.status = 'deleted';
    await this.serviceRepository.save(service);
  }

  async delete(id: number): Promise<void> {
    await this.serviceRepository.delete(id);
  }
}
