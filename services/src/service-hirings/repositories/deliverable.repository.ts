import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deliverable } from '../entities/deliverable.entity';

@Injectable()
export class DeliverableRepository {
  constructor(
    @InjectRepository(Deliverable)
    private readonly repository: Repository<Deliverable>,
  ) {}

  async create(deliverableData: Partial<Deliverable>): Promise<Deliverable> {
    const deliverable = this.repository.create(deliverableData);
    return this.repository.save(deliverable);
  }

  async createMany(
    deliverablesData: Partial<Deliverable>[],
  ): Promise<Deliverable[]> {
    const deliverables = this.repository.create(deliverablesData);
    return this.repository.save(deliverables);
  }

  async findByHiringId(hiringId: number): Promise<Deliverable[]> {
    return this.repository.find({
      where: { hiringId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findByHiringIds(hiringIds: number[]): Promise<Deliverable[]> {
    if (hiringIds.length === 0) {
      return [];
    }
    return this.repository
      .createQueryBuilder('deliverable')
      .where('deliverable.hiring_id IN (:...hiringIds)', { hiringIds })
      .orderBy('deliverable.hiring_id', 'ASC')
      .addOrderBy('deliverable.orderIndex', 'ASC')
      .getMany();
  }

  async findById(id: number): Promise<Deliverable | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async update(
    id: number,
    updateData: Partial<Deliverable>,
  ): Promise<Deliverable | null> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async deleteByHiringId(hiringId: number): Promise<void> {
    await this.repository.delete({ hiringId });
  }

  /**
   * Cancela todos los deliverables de una contratación por moderación
   */
  async cancelByModeration(hiringId: number, reason: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Deliverable)
      .set({
        status: 'cancelled_by_moderation' as any,
        moderationReason: reason,
        cancelledByModerationAt: new Date(),
      })
      .where('hiring_id = :hiringId', { hiringId })
      .andWhere('status NOT IN (:...finalStatuses)', {
        finalStatuses: ['approved', 'rejected', 'cancelled_by_moderation'],
      })
      .execute();

    return result.affected || 0;
  }

  /**
   * Cancela todos los deliverables de múltiples contrataciones por moderación
   */
  async cancelMultipleByModeration(
    hiringIds: number[],
    reason: string,
  ): Promise<number> {
    if (hiringIds.length === 0) return 0;

    const result = await this.repository
      .createQueryBuilder()
      .update(Deliverable)
      .set({
        status: 'cancelled_by_moderation' as any,
        moderationReason: reason,
        cancelledByModerationAt: new Date(),
      })
      .where('hiring_id IN (:...hiringIds)', { hiringIds })
      .andWhere('status NOT IN (:...finalStatuses)', {
        finalStatuses: ['approved', 'rejected', 'cancelled_by_moderation'],
      })
      .execute();

    return result.affected || 0;
  }
}
