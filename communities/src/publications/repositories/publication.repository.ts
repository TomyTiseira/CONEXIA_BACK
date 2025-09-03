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
    currentUserId?: number,
  ): Promise<[Publication[], number]> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.createQueryBuilder('publication')
      .where('publication.deletedAt IS NULL')
      .orderBy('publication.createdAt', 'DESC');

    // Si se proporciona currentUserId, filtrar publicaciones privadas
    if (currentUserId) {
      queryBuilder.andWhere(
        '(publication.privacy = :publicPrivacy OR (publication.privacy = :onlyFriendsPrivacy AND publication.userId = :currentUserId))',
        {
          publicPrivacy: 'public',
          onlyFriendsPrivacy: 'onlyFriends',
          currentUserId,
        },
      );
    } else {
      // Si no hay usuario actual, solo mostrar publicaciones públicas
      queryBuilder.andWhere('publication.privacy = :publicPrivacy', {
        publicPrivacy: 'public',
      });
    }

    return queryBuilder.skip(skip).take(limit).getManyAndCount();
  }

  async findActivePublicationsPaginatedWithFriendsFilter(
    page: number = 1,
    limit: number = 10,
    currentUserId?: number,
  ): Promise<[Publication[], number]> {
    const skip = (page - 1) * limit;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    // Usar una subconsulta para crear un campo de prioridad y ordenar correctamente
    const queryBuilder = this.createQueryBuilder('publication')
      .leftJoin(
        'connections',
        'connection',
        '((connection.sender_id = :currentUserId AND connection.receiver_id = publication.userId) OR (connection.receiver_id = :currentUserId AND connection.sender_id = publication.userId)) AND connection.status = :acceptedStatus',
        { currentUserId, acceptedStatus: 'accepted' },
      )
      .addSelect(
        `CASE 
          WHEN connection.id IS NOT NULL AND publication.createdAt > :oneDayAgo THEN 1
          ELSE 2
        END`,
        'priority',
      )
      .where('publication.deletedAt IS NULL')
      .andWhere('publication.createdAt > :fiveDaysAgo', { fiveDaysAgo })
      .andWhere('publication.userId != :currentUserId') // Excluir publicaciones propias
      .andWhere(
        `(
          -- Publicaciones de contactos de 1 día (prioridad alta)
          (connection.id IS NOT NULL AND publication.createdAt > :oneDayAgo) OR
          -- Publicaciones públicas de otros usuarios
          (publication.privacy = :publicPrivacy) OR
          -- Publicaciones privadas de contactos (más de 1 día de antigüedad)
          (publication.privacy = :onlyFriendsPrivacy AND connection.id IS NOT NULL AND publication.createdAt <= :oneDayAgo)
        )`,
        {
          publicPrivacy: 'public',
          onlyFriendsPrivacy: 'onlyFriends',
          currentUserId,
          oneDayAgo,
        },
      )
      .orderBy('priority', 'ASC')
      .addOrderBy('publication.createdAt', 'DESC');

    return queryBuilder.skip(skip).take(limit).getManyAndCount();
  }

  async findActivePublicationById(
    id: number,
    currentUserId?: number,
  ): Promise<Publication | null> {
    const queryBuilder = this.createQueryBuilder('publication')
      .where('publication.id = :id', { id })
      .andWhere('publication.deletedAt IS NULL');

    // Si se proporciona currentUserId, filtrar publicaciones privadas
    if (currentUserId) {
      queryBuilder.andWhere(
        '(publication.privacy = :publicPrivacy OR publication.userId = :currentUserId OR (publication.privacy = :onlyFriendsPrivacy AND :currentUserId IN (SELECT CASE WHEN c.sender_id = :currentUserId THEN c.receiver_id ELSE c.sender_id END FROM connections c WHERE ((c.sender_id = :currentUserId AND c.receiver_id = publication.userId) OR (c.receiver_id = :currentUserId AND c.sender_id = publication.userId)) AND c.status = :acceptedStatus)))',
        {
          publicPrivacy: 'public',
          onlyFriendsPrivacy: 'onlyFriends',
          currentUserId,
          acceptedStatus: 'accepted',
        },
      );
    } else {
      // Si no hay usuario actual, solo mostrar publicaciones públicas
      queryBuilder.andWhere('publication.privacy = :publicPrivacy', {
        publicPrivacy: 'public',
      });
    }

    return queryBuilder.getOne();
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
    currentUserId?: number,
  ): Promise<[Publication[], number]> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.createQueryBuilder('publication')
      .where('publication.userId = :userId', { userId })
      .andWhere('publication.deletedAt IS NULL')
      .orderBy('publication.createdAt', 'DESC');

    // Si se proporciona currentUserId, filtrar publicaciones privadas
    if (currentUserId) {
      queryBuilder.andWhere(
        '(publication.privacy = :publicPrivacy OR publication.userId = :currentUserId OR (publication.privacy = :onlyFriendsPrivacy AND :currentUserId IN (SELECT CASE WHEN c.sender_id = :currentUserId THEN c.receiver_id ELSE c.sender_id END FROM connections c WHERE ((c.sender_id = :currentUserId AND c.receiver_id = :userId) OR (c.receiver_id = :currentUserId AND c.sender_id = :userId)) AND c.status = :acceptedStatus)))',
        {
          publicPrivacy: 'public',
          onlyFriendsPrivacy: 'onlyFriends',
          currentUserId,
          userId,
          acceptedStatus: 'accepted',
        },
      );
    } else {
      // Si no hay usuario actual, solo mostrar publicaciones públicas
      queryBuilder.andWhere('publication.privacy = :publicPrivacy', {
        publicPrivacy: 'public',
      });
    }

    return queryBuilder.skip(skip).take(limit).getManyAndCount();
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
