import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliverySubmission } from '../entities/delivery-submission.entity';

@Injectable()
export class DeliverySubmissionRepository {
  constructor(
    @InjectRepository(DeliverySubmission)
    private readonly repository: Repository<DeliverySubmission>,
  ) {}

  async create(data: Partial<DeliverySubmission>): Promise<DeliverySubmission> {
    const delivery = this.repository.create(data);
    return this.repository.save(delivery);
  }

  async findById(id: number): Promise<DeliverySubmission | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['hiring', 'hiring.service', 'deliverable', 'attachments'],
      order: { attachments: { orderIndex: 'ASC' } },
    });
  }

  async findByHiringId(hiringId: number): Promise<DeliverySubmission[]> {
    return this.repository.find({
      where: { hiringId },
      relations: ['deliverable', 'attachments'],
      order: { createdAt: 'DESC', attachments: { orderIndex: 'ASC' } },
    });
  }

  async findByDeliverableId(
    deliverableId: number,
  ): Promise<DeliverySubmission[]> {
    return this.repository.find({
      where: { deliverableId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    data: Partial<DeliverySubmission>,
  ): Promise<DeliverySubmission | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async findLatestByDeliverableId(
    deliverableId: number,
  ): Promise<DeliverySubmission | null> {
    return this.repository.findOne({
      where: { deliverableId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByHiringId(
    hiringId: number,
  ): Promise<DeliverySubmission | null> {
    return this.repository.findOne({
      where: { hiringId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cancela todas las entregas de una contratación por moderación
   */
  async cancelByModeration(hiringId: number, reason: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(DeliverySubmission)
      .set({
        status: 'cancelled_by_moderation' as any,
        moderationReason: reason,
        cancelledByModerationAt: new Date(),
      })
      .where('hiring_id = :hiringId', { hiringId })
      .andWhere('status NOT IN (:...finalStatuses)', {
        finalStatuses: ['approved', 'cancelled_by_moderation'],
      })
      .execute();

    return result.affected || 0;
  }

  /**
   * Cancela todas las entregas de múltiples contrataciones por moderación
   */
  async cancelMultipleByModeration(
    hiringIds: number[],
    reason: string,
  ): Promise<number> {
    if (hiringIds.length === 0) return 0;

    const result = await this.repository
      .createQueryBuilder()
      .update(DeliverySubmission)
      .set({
        status: 'cancelled_by_moderation' as any,
        moderationReason: reason,
        cancelledByModerationAt: new Date(),
      })
      .where('hiring_id IN (:...hiringIds)', { hiringIds })
      .andWhere('status NOT IN (:...finalStatuses)', {
        finalStatuses: ['approved', 'cancelled_by_moderation'],
      })
      .execute();

    return result.affected || 0;
  }
}
