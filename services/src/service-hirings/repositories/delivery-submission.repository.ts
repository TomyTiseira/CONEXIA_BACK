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
}
