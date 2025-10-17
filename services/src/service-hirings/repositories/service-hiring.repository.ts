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

  async findById(
    id: number,
    relations?: string[],
  ): Promise<ServiceHiring | null> {
    return this.repository.findOne({
      where: { id },
      relations: relations || ['status', 'service', 'paymentModality'],
    });
  }

  async findByUserAndService(
    userId: number,
    serviceId: number,
  ): Promise<ServiceHiring | null> {
    return this.repository.findOne({
      where: { userId, serviceId },
      relations: ['status', 'service', 'paymentModality'],
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
      .leftJoinAndSelect('hiring.service', 'service')
      .leftJoinAndSelect('hiring.paymentModality', 'paymentModality');

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
    const { page = 1, limit = 10, status, serviceId } = params;

    const queryBuilder: SelectQueryBuilder<ServiceHiring> = this.repository
      .createQueryBuilder('hiring')
      .leftJoinAndSelect('hiring.status', 'status')
      .leftJoinAndSelect('hiring.service', 'service')
      .leftJoinAndSelect('hiring.paymentModality', 'paymentModality')
      .where('service.userId = :serviceOwnerId', { serviceOwnerId });

    if (status) {
      queryBuilder.andWhere('status.code = :status', { status });
    }

    // Filtrar por serviceId específico si se proporciona
    if (serviceId) {
      queryBuilder.andWhere('hiring.serviceId = :serviceId', { serviceId });
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

  async hasActiveHiringsForService(serviceId: number): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('hiring')
      .leftJoin('hiring.status', 'status')
      .where('hiring.serviceId = :serviceId', { serviceId })
      .andWhere('status.code NOT IN (:...finalStatuses)', {
        finalStatuses: ['completed', 'cancelled', 'rejected'],
      })
      .getCount();

    return count > 0;
  }

  async getQuotationInfoForServices(
    serviceIds: number[],
    userId?: number,
  ): Promise<
    Map<
      number,
      {
        hasPending: boolean;
        hasActive: boolean;
        pendingQuotationId?: number;
        activeQuotationId?: number;
      }
    >
  > {
    if (serviceIds.length === 0) {
      return new Map();
    }

    const queryBuilder = this.repository
      .createQueryBuilder('hiring')
      .leftJoin('hiring.status', 'status')
      .select('hiring.serviceId', 'serviceId')
      .addSelect('hiring.id', 'hiringId')
      .addSelect('status.code', 'statusCode')
      .where('hiring.serviceId IN (:...serviceIds)', { serviceIds });

    if (userId) {
      queryBuilder.andWhere('hiring.userId = :userId', { userId });
    }

    const results = await queryBuilder.getRawMany();

    const quotationMap = new Map<
      number,
      {
        hasPending: boolean;
        hasActive: boolean;
        pendingQuotationId?: number;
        activeQuotationId?: number;
      }
    >();

    // Initialize all services
    serviceIds.forEach((serviceId) => {
      quotationMap.set(serviceId, { hasPending: false, hasActive: false });
    });

    // Process results
    results.forEach((result) => {
      const serviceId = result.serviceId;
      const hiringId = result.hiringId;
      const statusCode = result.statusCode;
      const current = quotationMap.get(serviceId) || {
        hasPending: false,
        hasActive: false,
      };

      if (statusCode === 'pending') {
        current.hasPending = true;
        current.pendingQuotationId = hiringId;
      }

      if (
        [
          'pending',
          'quoted',
          'accepted',
          'in_progress',
          'negotiating',
        ].includes(statusCode)
      ) {
        current.hasActive = true;
        current.activeQuotationId = hiringId;
      }

      quotationMap.set(serviceId, current);
    });

    return quotationMap;
  }

  async markExpiredQuotations(expiredStatusId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(ServiceHiring)
      .set({ statusId: expiredStatusId })
      .where('quotedAt IS NOT NULL')
      .andWhere('quotationValidityDays IS NOT NULL')
      .andWhere(
        'statusId IN (SELECT id FROM service_hiring_statuses WHERE code IN (:...activeCodes))',
        {
          activeCodes: ['quoted', 'negotiating'],
        },
      )
      .andWhere(
        'DATE_ADD(quotedAt, INTERVAL quotationValidityDays DAY) < NOW()',
      )
      .execute();

    return result.affected || 0;
  }

  async findActiveHiringByUserAndService(
    userId: number,
    serviceId: number,
  ): Promise<ServiceHiring | null> {
    return this.repository
      .createQueryBuilder('hiring')
      .leftJoinAndSelect('hiring.status', 'status')
      .leftJoinAndSelect('hiring.service', 'service')
      .where('hiring.userId = :userId', { userId })
      .andWhere('hiring.serviceId = :serviceId', { serviceId })
      .andWhere('status.code IN (:...activeStatuses)', {
        activeStatuses: ['approved', 'in_progress'],
      })
      .getOne();
  }
}
