import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceReview } from '../entities/service-review.entity';

@Injectable()
export class ServiceReviewRepository {
  constructor(
    @InjectRepository(ServiceReview)
    private readonly repository: Repository<ServiceReview>,
  ) {}

  async create(reviewData: Partial<ServiceReview>): Promise<ServiceReview> {
    const review = this.repository.create(reviewData);
    return await this.repository.save(review);
  }

  async findById(id: number): Promise<ServiceReview | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Encontrar una reseña por ID con toda la información necesaria
   * Útil para obtener una reseña específica desde el frontend
   */
  async findOneById(id: number): Promise<ServiceReview | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findByHiringId(hiringId: number): Promise<ServiceReview | null> {
    return await this.repository.findOne({
      where: { hiringId },
    });
  }

  async findByServiceId(
    serviceId: number,
    page: number = 1,
    limit: number = 10,
    rating?: number,
  ): Promise<{ reviews: ServiceReview[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder('review')
      .where('review.serviceId = :serviceId', { serviceId });

    // Aplicar filtro de rating si se proporciona
    if (rating !== undefined && rating >= 1 && rating <= 5) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    queryBuilder
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return { reviews, total };
  }

  async getServiceAverageRating(
    serviceId: number,
  ): Promise<{ average: number; count: number }> {
    const result = await this.repository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.serviceId = :serviceId', { serviceId })
      .getRawOne();

    return {
      average: parseFloat(result.average) || 0,
      count: parseInt(result.count) || 0,
    };
  }

  async getRatingDistribution(
    serviceId: number,
  ): Promise<Record<number, number>> {
    const results = await this.repository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.serviceId = :serviceId', { serviceId })
      .groupBy('review.rating')
      .getRawMany();

    // Initialize with zeros for all ratings 1-5
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    // Fill with actual counts
    results.forEach((result) => {
      const rating = parseInt(result.rating);
      const count = parseInt(result.count);
      if (rating >= 1 && rating <= 5) {
        distribution[rating] = count;
      }
    });

    return distribution;
  }

  async update(
    id: number,
    updateData: Partial<ServiceReview>,
  ): Promise<ServiceReview | null> {
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async hasUserReviewedHiring(
    userId: number,
    hiringId: number,
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: { reviewerUserId: userId, hiringId },
    });
    return count > 0;
  }
}
