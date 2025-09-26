import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  PaymentAccount,
  PaymentAccountType,
} from '../../shared/entities/payment-account.entity';

@Injectable()
export class PaymentAccountRepository {
  constructor(
    @InjectRepository(PaymentAccount)
    private readonly paymentAccountRepository: Repository<PaymentAccount>,
  ) {}

  async create(
    paymentAccount: Partial<PaymentAccount>,
  ): Promise<PaymentAccount> {
    const newPaymentAccount =
      this.paymentAccountRepository.create(paymentAccount);
    return await this.paymentAccountRepository.save(newPaymentAccount);
  }

  async findByUserId(userId: number): Promise<PaymentAccount[]> {
    return await this.paymentAccountRepository.find({
      where: { userId, deletedAt: IsNull() },
      relations: ['bank', 'digitalPlatform'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<PaymentAccount | null> {
    return await this.paymentAccountRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['bank', 'digitalPlatform'],
    });
  }

  async findByCbuOrAlias(
    cbu: string,
    alias?: string,
  ): Promise<PaymentAccount | null> {
    const queryBuilder = this.paymentAccountRepository
      .createQueryBuilder('paymentAccount')
      .where('paymentAccount.cbu = :cbu', { cbu })
      .andWhere('paymentAccount.deletedAt IS NULL');

    if (alias) {
      queryBuilder.orWhere('paymentAccount.alias = :alias', { alias });
    }

    return await queryBuilder.getOne();
  }

  async update(
    id: number,
    updateData: Partial<PaymentAccount>,
  ): Promise<PaymentAccount | null> {
    await this.paymentAccountRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<void> {
    await this.paymentAccountRepository.softDelete(id);
  }

  async findByUserIdAndType(
    userId: number,
    type: string,
  ): Promise<PaymentAccount[]> {
    return await this.paymentAccountRepository.find({
      where: { userId, type: type as PaymentAccountType, deletedAt: IsNull() },
      relations: ['bank', 'digitalPlatform'],
      order: { createdAt: 'DESC' },
    });
  }
}
