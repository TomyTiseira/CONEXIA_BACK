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
    const defaultRelations = ['status', 'service', 'paymentModality'];
    const allRelations = relations || defaultRelations;

    const hiring = await this.repository.findOne({
      where: { id },
      relations: allRelations,
    });

    // Si el hiring está en estado 'in_claim', cargar el claim activo
    if (hiring && hiring.status?.code === 'in_claim') {
      const qb = this.repository
        .createQueryBuilder('hiring')
        .leftJoinAndSelect(
          'hiring.claims',
          'claim',
          "claim.status IN ('open', 'in_review', 'pending_clarification')",
        )
        .where('hiring.id = :id', { id })
        .orderBy('claim.createdAt', 'DESC')
        .limit(1);

      const hiringWithClaim = await qb.getOne();
      if (hiringWithClaim?.claims) {
        hiring.claims = hiringWithClaim.claims;
      }
    }

    return hiring;
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
      .leftJoinAndSelect('hiring.paymentModality', 'paymentModality')
      .leftJoinAndSelect(
        'hiring.claims',
        'claim',
        "status.code = 'in_claim' AND claim.status IN ('open', 'in_review', 'pending_clarification')",
      );

    if (status) {
      queryBuilder.andWhere('status.code = :status', { status });
    }

    if (serviceId) {
      queryBuilder.andWhere('hiring.serviceId = :serviceId', { serviceId });
    }

    if (serviceId) {
      queryBuilder.andWhere('hiring.serviceId = :serviceId', { serviceId });
    }

    // Ordenamiento: pendientes primero, estados activos en medio, finales al final
    queryBuilder
      .addSelect(
        `CASE 
          WHEN status.code IN ('completed', 'rejected', 'cancelled', 'cancelled_by_claim', 'completed_by_claim', 'completed_with_agreement') THEN 2
          WHEN status.code = 'pending' THEN 0
          ELSE 1
        END`,
        'priority_order',
      )
      .orderBy('priority_order', 'ASC')
      .addOrderBy('hiring.updatedAt', 'DESC')
      .addOrderBy('claim.createdAt', 'DESC'); // Claim más reciente primero

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
      .leftJoinAndSelect(
        'hiring.claims',
        'claim',
        "status.code = 'in_claim' AND claim.status IN ('open', 'in_review', 'pending_clarification')",
      )
      .where('service.userId = :serviceOwnerId', { serviceOwnerId });

    if (status) {
      queryBuilder.andWhere('status.code = :status', { status });
    }

    // Filtrar por serviceId específico si se proporciona
    if (serviceId) {
      queryBuilder.andWhere('hiring.serviceId = :serviceId', { serviceId });
    }

    // Ordenamiento: pendientes primero, estados activos en medio, finales al final
    queryBuilder
      .addSelect(
        `CASE 
          WHEN status.code IN ('completed', 'rejected', 'cancelled', 'cancelled_by_claim', 'completed_by_claim', 'completed_with_agreement') THEN 2
          WHEN status.code = 'pending' THEN 0
          ELSE 1
        END`,
        'priority_order',
      )
      .orderBy('priority_order', 'ASC')
      .addOrderBy('hiring.updatedAt', 'DESC')
      .addOrderBy('claim.createdAt', 'DESC'); // Claim más reciente primero

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

  async findAnyHiringByUserAndService(
    userId: number,
    serviceId: number,
  ): Promise<ServiceHiring | null> {
    return this.repository
      .createQueryBuilder('hiring')
      .leftJoinAndSelect('hiring.status', 'status')
      .leftJoinAndSelect('hiring.service', 'service')
      .leftJoinAndSelect('hiring.paymentModality', 'paymentModality')
      .where('hiring.userId = :userId', { userId })
      .andWhere('hiring.serviceId = :serviceId', { serviceId })
      .andWhere('status.code NOT IN (:...finalStatuses)', {
        finalStatuses: ['completed', 'cancelled', 'rejected'],
      })
      .orderBy('hiring.createdAt', 'DESC')
      .getOne();
  }

  /**
   * Recalculate the ServiceHiring status based on the statuses of its deliveries.
   * Rules (matching backend spec):
   *  - If any delivery has status 'revision_requested' => hiring = 'revision_requested'
   *  - Else if all deliveries are 'approved' => hiring = 'completed' (the caller may verify payments)
   *  - Else if all deliveries are 'delivered' or 'approved' => hiring = 'delivered'
   *  - Else if any delivery is 'pending' => hiring = 'in_progress'
   *  - Default => 'in_progress'
   *
   * IMPORTANT: Solo considera la entrega MÁS RECIENTE de cada deliverable/hiring
   */
  async recalculateStatusFromDeliveries(hiringId: number): Promise<void> {
    // Fetch LATEST delivery status for each deliverable (or for the hiring if no deliverables)
    // GROUP BY deliverable_id (o NULL si no tiene) y tomar la más reciente por deliveredAt
    const deliveries = await this.repository.query(
      `
      SELECT DISTINCT ON (COALESCE(deliverable_id, 0)) 
        status,
        deliverable_id,
        "deliveredAt"
      FROM delivery_submissions 
      WHERE hiring_id = $1
      ORDER BY COALESCE(deliverable_id, 0), "deliveredAt" DESC
      `,
      [hiringId],
    );

    const statuses = deliveries.map((r: any) => r.status);

    // Determine target code
    let targetCode = 'in_progress';

    if (statuses.length === 0) {
      targetCode = 'in_progress';
    } else if (statuses.includes('revision_requested')) {
      targetCode = 'revision_requested';
    } else if (statuses.every((s: string) => s === 'approved')) {
      targetCode = 'completed';
    } else if (
      statuses.every(
        (s: string) =>
          s === 'delivered' || s === 'approved' || s === 'pending_payment',
      )
    ) {
      targetCode = 'delivered';
    } else if (statuses.some((s: string) => s === 'pending')) {
      targetCode = 'in_progress';
    }

    console.log('🔄 Recalculating hiring status:', {
      hiringId,
      deliveriesCount: deliveries.length,
      latestStatuses: statuses,
      newStatus: targetCode,
    });

    // Update the hiring status if different
    await this.repository.query(
      `UPDATE service_hirings SET status_id = (SELECT id FROM service_hiring_statuses WHERE code = $1) WHERE id = $2`,
      [targetCode, hiringId],
    );
  }

  async countActiveHiringsByUserId(
    userId: number,
    activeStatuses: string[],
  ): Promise<number> {
    return this.repository
      .createQueryBuilder('hiring')
      .leftJoin('hiring.status', 'status')
      .where('hiring.userId = :userId', { userId })
      .andWhere('status.code IN (:...activeStatuses)', { activeStatuses })
      .getCount();
  }
}
