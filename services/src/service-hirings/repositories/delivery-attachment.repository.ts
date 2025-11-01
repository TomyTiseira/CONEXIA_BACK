import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryAttachment } from '../entities/delivery-attachment.entity';

@Injectable()
export class DeliveryAttachmentRepository {
  constructor(
    @InjectRepository(DeliveryAttachment)
    private readonly repository: Repository<DeliveryAttachment>,
  ) {}

  async create(data: Partial<DeliveryAttachment>): Promise<DeliveryAttachment> {
    const attachment = this.repository.create(data);
    return this.repository.save(attachment);
  }

  async createMany(
    attachments: Partial<DeliveryAttachment>[],
  ): Promise<DeliveryAttachment[]> {
    const entities = this.repository.create(attachments);
    return this.repository.save(entities);
  }

  async findByDeliveryId(deliveryId: number): Promise<DeliveryAttachment[]> {
    return this.repository.find({
      where: { deliveryId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: number): Promise<DeliveryAttachment | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(
    id: number,
    data: Partial<DeliveryAttachment>,
  ): Promise<DeliveryAttachment | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async deleteByDeliveryId(deliveryId: number): Promise<boolean> {
    const result = await this.repository.delete({ deliveryId });
    return result.affected ? result.affected > 0 : false;
  }
}
