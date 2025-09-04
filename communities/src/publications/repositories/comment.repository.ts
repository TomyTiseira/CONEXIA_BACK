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
    sortBy: string = 'recent', // 'recent' | 'relevance'
  ): Promise<[PublicationComment[], number]> {
    const skip = (page - 1) * limit;

    const query = this.createQueryBuilder('comment')
      .where('comment.publicationId = :publicationId', { publicationId })
      .andWhere('comment.deletedAt IS NULL');

    if (sortBy === 'relevance') {
      // Esto asume que tienes una tabla de reacciones para comentarios
      // Si no existe, necesitarás implementarla primero o usar otro criterio de relevancia
      query
        .leftJoin('comment_reactions', 'cr', 'cr.commentId = comment.id')
        .addSelect('COUNT(cr.id)', 'reactionCount')
        .groupBy('comment.id')
        .orderBy('reactionCount', 'DESC')
        .addOrderBy('comment.createdAt', 'DESC');
    } else {
      // Por defecto, ordenar por fecha (más recientes primero)
      query.orderBy('comment.createdAt', 'DESC');
    }

    return query.skip(skip).take(limit).getManyAndCount();
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
