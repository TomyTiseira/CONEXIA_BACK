import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PublicationComment } from '../entities/publication-comment.entity';

@Injectable()
export class CommentRepository extends Repository<PublicationComment> {
  constructor(private dataSource: DataSource) {
    super(PublicationComment, dataSource.createEntityManager());
  }

  async findActiveCommentsByPublicationId(
    publicationId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[PublicationComment[], number]> {
    const skip = (page - 1) * limit;

    return this.createQueryBuilder('comment')
      .where('comment.publicationId = :publicationId', { publicationId })
      .andWhere('comment.deletedAt IS NULL')
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
  }

  async findActiveCommentById(id: number): Promise<PublicationComment | null> {
    return this.createQueryBuilder('comment')
      .where('comment.id = :id', { id })
      .andWhere('comment.deletedAt IS NULL')
      .getOne();
  }

  async findActiveCommentsByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[PublicationComment[], number]> {
    const skip = (page - 1) * limit;

    return this.createQueryBuilder('comment')
      .where('comment.userId = :userId', { userId })
      .andWhere('comment.deletedAt IS NULL')
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
  }
}
