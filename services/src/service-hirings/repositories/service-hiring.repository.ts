import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { GetServiceHiringsDto } from '../dto';
import { ServiceHiring } from '../entities/service-hiring.entity';

@Injectable()
export class ServiceHiringRepository {
  constructor(
    @InjectRepository(ServiceHiring)
    private readonly repository: Repository<ServiceHiring>,
  ) {}

  async create(serviceHiring: Partial<ServiceHiring>): Promise<ServiceHiring> {
    const newHiring = this.repository.create(serviceHiring);
    return this.repository.save(newHiring);
  }

  async findById(id: number): Promise<ServiceHiring | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['status', 'service'],
    });
  }

  async findByUserAndService(
    userId: number,
    serviceId: number,
  ): Promise<ServiceHiring | null> {
    return this.repository.findOne({
      where: { userId, serviceId },
      relations: ['status', 'service'],
    });
  }

  async update(
    id: number,
    updateData: Partial<ServiceHiring>,
  ): Promise<ServiceHiring | null> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async findWithPagination(
    params: GetServiceHiringsDto,
  ): Promise<{ data: ServiceHiring[]; total: number }> {
    const { page = 1, limit = 10, status, serviceId, userId } = params;

    const queryBuilder: SelectQueryBuilder<ServiceHiring> = this.repository
      .createQueryBuilder('hiring')
      .leftJoinAndSelect('hiring.status', 'status')
      .leftJoinAndSelect('hiring.service', 'service');

    if (status) {
      queryBuilder.andWhere('status.code = :status', { status });
    }

    if (serviceId) {
      queryBuilder.andWhere('hiring.serviceId = :serviceId', { serviceId });
    }

    if (userId) {
      queryBuilder.andWhere('hiring.userId = :userId', { userId });
    }

    // Ordenamiento: pendientes primero, luego por fecha
    queryBuilder
      .addSelect(
        "CASE WHEN status.code = 'pending' THEN 0 ELSE 1 END",
        'priority_order',
      )
      .orderBy('priority_order', 'ASC')
      .addOrderBy('hiring.createdAt', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findByServiceOwner(
    serviceOwnerId: number,
    params: GetServiceHiringsDto,
  ): Promise<{ data: ServiceHiring[]; total: number }> {
    const { page = 1, limit = 10, status } = params;

    const queryBuilder: SelectQueryBuilder<ServiceHiring> = this.repository
      .createQueryBuilder('hiring')
      .leftJoinAndSelect('hiring.status', 'status')
      .leftJoinAndSelect('hiring.service', 'service')
      .where('service.userId = :serviceOwnerId', { serviceOwnerId });

    if (status) {
      queryBuilder.andWhere('status.code = :status', { status });
    }

    // Ordenamiento: pendientes primero, luego por fecha
    queryBuilder
      .addSelect(
        "CASE WHEN status.code = 'pending' THEN 0 ELSE 1 END",
        'priority_order',
      )
      .orderBy('priority_order', 'ASC')
      .addOrderBy('hiring.createdAt', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }
}
