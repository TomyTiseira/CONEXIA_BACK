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

  async findActivePublicationsPaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<[Publication[], number]> {
    const skip = (page - 1) * limit;

    return this.createQueryBuilder('publication')
      .where('publication.deletedAt IS NULL')
      .orderBy('publication.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
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

  async findPublicationsByUserPaginated(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Publication[], number]> {
    const skip = (page - 1) * limit;

    return this.createQueryBuilder('publication')
      .where('publication.userId = :userId', { userId })
      .andWhere('publication.deletedAt IS NULL')
      .orderBy('publication.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
  }

  async softDeletePublication(id: number): Promise<void> {
    await this.update(id, { deletedAt: new Date(), isActive: false });
  }

  async updatePublication(
    id: number,
    updateDto: Partial<Publication>,
  ): Promise<void> {
    await this.createQueryBuilder()
      .update(Publication)
      .set(updateDto)
      .where('id = :id', { id })
      .execute();
  }
}
