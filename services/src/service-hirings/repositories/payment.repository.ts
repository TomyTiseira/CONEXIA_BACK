import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const payment = this.repository.create(paymentData);
    return this.repository.save(payment);
  }

  async findById(id: number): Promise<Payment | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['hiring'],
    });
  }

  async findByHiringId(hiringId: number): Promise<Payment[]> {
    return this.repository.find({
      where: { hiringId },
      relations: ['hiring'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByMercadoPagoPaymentId(
    mercadoPagoPaymentId: string,
  ): Promise<Payment | null> {
    return this.repository.findOne({
      where: { mercadoPagoPaymentId },
      relations: ['hiring'],
    });
  }

  async update(
    id: number,
    updateData: Partial<Payment>,
  ): Promise<Payment | null> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async findPendingPayments(): Promise<Payment[]> {
    return this.repository.find({
      where: { status: PaymentStatus.PENDING },
      relations: ['hiring'],
    });
  }

  async findSuccessfulPaymentByHiring(
    hiringId: number,
  ): Promise<Payment | null> {
    return this.repository.findOne({
      where: {
        hiringId,
        status: PaymentStatus.APPROVED,
      },
      relations: ['hiring'],
    });
  }
}
