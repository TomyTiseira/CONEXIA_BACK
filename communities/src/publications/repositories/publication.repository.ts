import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Publication } from '../entities/publication.entity';

@Injectable()
export class PublicationRepository extends Repository<Publication> {
  constructor(private dataSource: DataSource) {
    super(Publication, dataSource.createEntityManager());
  }

  async findActivePublications(): Promise<Publication[]> {
    return this.createQueryBuilder('publication')
      .where('publication.deletedAt IS NULL')
      .orderBy('publication.createdAt', 'DESC')
      .getMany();
  }

  async findActivePublicationById(id: number): Promise<Publication | null> {
    return this.createQueryBuilder('publication')
      .where('publication.id = :id', { id })
      .andWhere('publication.deletedAt IS NULL')
      .getOne();
  }

  async findPublicationsByUser(userId: number): Promise<Publication[]> {
    return this.createQueryBuilder('publication')
      .where('publication.userId = :userId', { userId })
      .andWhere('publication.deletedAt IS NULL')
      .orderBy('publication.createdAt', 'DESC')
      .getMany();
  }

  async softDeletePublication(id: number): Promise<void> {
    await this.update(id, { deletedAt: new Date() });
  }
}
