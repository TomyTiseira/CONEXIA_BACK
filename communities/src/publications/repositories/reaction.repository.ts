import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PublicationReaction } from '../entities/publication-reaction.entity';

@Injectable()
export class ReactionRepository extends Repository<PublicationReaction> {
  constructor(private dataSource: DataSource) {
    super(PublicationReaction, dataSource.createEntityManager());
  }

  async findActiveReactionsByPublicationId(
    publicationId: number,
    page: number = 1,
    limit: number = 10,
    type?: string,
  ): Promise<[PublicationReaction[], number]> {
    const skip = (page - 1) * limit;

    const query = this.createQueryBuilder('reaction')
      .where('reaction.publicationId = :publicationId', { publicationId })
      .andWhere('reaction.deletedAt IS NULL')
      .orderBy('reaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (type) {
      query.andWhere('reaction.type = :type', { type });
    }

    return query.getManyAndCount();
  }

  async findActiveReactionById(
    id: number,
  ): Promise<PublicationReaction | null> {
    return this.createQueryBuilder('reaction')
      .where('reaction.id = :id', { id })
      .andWhere('reaction.deletedAt IS NULL')
      .getOne();
  }

  async findUserReactionToPublication(
    userId: number,
    publicationId: number,
  ): Promise<PublicationReaction | null> {
    return this.createQueryBuilder('reaction')
      .where('reaction.userId = :userId', { userId })
      .andWhere('reaction.publicationId = :publicationId', { publicationId })
      .andWhere('reaction.deletedAt IS NULL')
      .getOne();
  }

  async countReactionsByTypeAndPublicationId(
    publicationId: number,
  ): Promise<{ type: string; count: number }[]> {
    return this.createQueryBuilder('reaction')
      .select('reaction.type', 'type')
      .addSelect('COUNT(reaction.id)', 'count')
      .where('reaction.publicationId = :publicationId', { publicationId })
      .andWhere('reaction.deletedAt IS NULL')
      .groupBy('reaction.type')
      .getRawMany();
  }
}
