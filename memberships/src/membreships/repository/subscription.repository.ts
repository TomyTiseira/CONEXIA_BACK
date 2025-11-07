import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/membreship.entity';

interface UpdateSubscriptionData {
  status?: SubscriptionStatus;
  preferenceId?: string;
  paymentId?: string;
  mercadoPagoSubscriptionId?: string;
  paymentStatus?: string;
  paymentStatusDetail?: string;
  paidAt?: Date;
  startDate?: Date;
  endDate?: Date;
  nextPaymentDate?: Date | null;
  retryCount?: number;
  autoRenew?: boolean;
}

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async create(subscription: Partial<Subscription>): Promise<Subscription> {
    const newSubscription = this.subscriptionRepository.create(subscription);
    return this.subscriptionRepository.save(newSubscription);
  }

  async findById(id: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { id },
      relations: ['plan'],
    });
  }

  async findByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status?: SubscriptionStatus,
  ): Promise<{ subscriptions: Subscription[]; total: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.userId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('subscription.status = :status', { status });
    }

    queryBuilder
      .orderBy('subscription.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [subscriptions, total] = await queryBuilder.getManyAndCount();

    return { subscriptions, total };
  }

  async findActiveByUserId(userId: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        deletedAt: IsNull(),
      },
      relations: ['plan'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByPreferenceId(preferenceId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { preferenceId },
      relations: ['plan'],
    });
  }

  async findByMercadoPagoSubscriptionId(
    mercadoPagoSubscriptionId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { mercadoPagoSubscriptionId },
      relations: ['plan'],
    });
  }

  async update(
    id: number,
    data: UpdateSubscriptionData,
  ): Promise<Subscription | null> {
    await this.subscriptionRepository.update(id, data);
    return this.findById(id);
  }

  async findPendingRenewals(): Promise<Subscription[]> {
    const currentDate = new Date();

    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.status = :status', {
        status: SubscriptionStatus.ACTIVE,
      })
      .andWhere('subscription.autoRenew = :autoRenew', { autoRenew: true })
      .andWhere('subscription.endDate <= :endDate', {
        endDate: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 días antes
      })
      .getMany();
  }

  async findExpired(): Promise<Subscription[]> {
    const currentDate = new Date();

    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.status = :status', {
        status: SubscriptionStatus.ACTIVE,
      })
      .andWhere('subscription.endDate < :currentDate', { currentDate })
      .getMany();
  }
}
