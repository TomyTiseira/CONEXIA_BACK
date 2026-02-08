import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentModality } from '../entities/payment-modality.entity';
import { PaymentModalityCode } from '../enums/payment-modality.enum';

@Injectable()
export class PaymentModalityRepository {
  constructor(
    @InjectRepository(PaymentModality)
    private readonly repository: Repository<PaymentModality>,
  ) {}

  async create(
    modalityData: Partial<PaymentModality>,
  ): Promise<PaymentModality> {
    const modality = this.repository.create(modalityData);
    return this.repository.save(modality);
  }

  async findAll(): Promise<PaymentModality[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findByCode(code: PaymentModalityCode): Promise<PaymentModality | null> {
    return this.repository.findOne({
      where: { code, isActive: true },
    });
  }

  async findById(id: number): Promise<PaymentModality | null> {
    return this.repository.findOne({
      where: { id },
    });
  }
}
