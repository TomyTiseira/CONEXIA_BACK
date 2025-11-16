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
      .leftJoinAndSelect('publication.media', 'media')
      .where('publication.deletedAt IS NULL')
      .orderBy('publication.createdAt', 'DESC')
      .addOrderBy('media.displayOrder', 'ASC')
      .getMany();
  }

  async findActivePublicationsPaginated(
    page: number = 1,
    limit: number = 10,
    currentUserId?: number,
  ): Promise<[Publication[], number]> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.createQueryBuilder('publication')
      .leftJoinAndSelect('publication.media', 'media')
      .where('publication.deletedAt IS NULL')
      .orderBy('publication.createdAt', 'DESC')
      .addOrderBy('media.displayOrder', 'ASC');

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

    // Usar una subconsulta para crear un campo de prioridad y ordenar correctamente
    const queryBuilder = this.createQueryBuilder('publication')
      .leftJoinAndSelect('publication.media', 'media')
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
      .addOrderBy('publication.createdAt', 'DESC')
      .addOrderBy('media.displayOrder', 'ASC');

    return queryBuilder.skip(skip).take(limit).getManyAndCount();
  }

  async findActivePublicationById(
    id: number,
    currentUserId?: number,
  ): Promise<Publication | null> {
    const queryBuilder = this.createQueryBuilder('publication')
      .leftJoinAndSelect('publication.media', 'media')
      .where('publication.id = :id', { id })
      .andWhere('publication.deletedAt IS NULL')
      .orderBy('media.displayOrder', 'ASC');

    // Si se proporciona currentUserId, filtrar publicaciones privadas
    if (currentUserId) {
      // Usar LEFT JOIN para verificar la conexión de amistad
      queryBuilder
        .leftJoin(
          'connections',
          'connection',
          '((connection.sender_id = :currentUserId AND connection.receiver_id = publication.userId) OR (connection.receiver_id = :currentUserId AND connection.sender_id = publication.userId)) AND connection.status = :acceptedStatus',
          { currentUserId, acceptedStatus: 'accepted' },
        )
        .andWhere(
          '(publication.privacy = :publicPrivacy OR publication.userId = :currentUserId OR (publication.privacy = :onlyFriendsPrivacy AND connection.id IS NOT NULL))',
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
      .leftJoinAndSelect('publication.media', 'media')
      .where('publication.userId = :userId', { userId })
      .andWhere('publication.deletedAt IS NULL')
      .orderBy('publication.createdAt', 'DESC')
      .addOrderBy('media.displayOrder', 'ASC');

    // Si se proporciona currentUserId, filtrar publicaciones privadas
    if (currentUserId) {
      // Usar LEFT JOIN para verificar la conexión de amistad
      queryBuilder
        .leftJoin(
          'connections',
          'connection',
          '((connection.sender_id = :currentUserId AND connection.receiver_id = :userId) OR (connection.receiver_id = :currentUserId AND connection.sender_id = :userId)) AND connection.status = :acceptedStatus',
          { currentUserId, userId, acceptedStatus: 'accepted' },
        )
        .andWhere(
          '(publication.privacy = :publicPrivacy OR publication.userId = :currentUserId OR (publication.privacy = :onlyFriendsPrivacy AND connection.id IS NOT NULL))',
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

  async findActivePublicationByIdWithDetails(
    id: number,
    currentUserId?: number,
  ): Promise<any> {
    const baseQuery = this.createQueryBuilder('publication')
      .select('publication.id', 'publication_id')
      .addSelect('publication.description', 'publication_description')
      .addSelect('publication.mediaUrl', 'publication_mediaUrl')
      .addSelect('publication.mediaType', 'publication_mediaType')
      .addSelect('publication.privacy', 'publication_privacy')
      .addSelect('publication.userId', 'publication_userId')
      .addSelect('publication.isActive', 'publication_isActive')
      .addSelect('publication.createdAt', 'publication_createdAt')
      .addSelect('publication.updatedAt', 'publication_updatedAt')
      .addSelect('publication.deletedAt', 'publication_deletedAt')
      .addSelect(
        `(SELECT COUNT(*) FROM publication_reactions r WHERE r.publication_id = publication.id AND r.type = 'like' AND r.deleted_at IS NULL)`,
        'like_count',
      )
      .addSelect(
        `(SELECT COUNT(*) FROM publication_reactions r WHERE r.publication_id = publication.id AND r.type = 'love' AND r.deleted_at IS NULL)`,
        'love_count',
      )
      .addSelect(
        `(SELECT COUNT(*) FROM publication_reactions r WHERE r.publication_id = publication.id AND r.type = 'support' AND r.deleted_at IS NULL)`,
        'support_count',
      )
      .addSelect(
        `(SELECT COUNT(*) FROM publication_reactions r WHERE r.publication_id = publication.id AND r.type = 'celebrate' AND r.deleted_at IS NULL)`,
        'celebrate_count',
      )
      .addSelect(
        `(SELECT COUNT(*) FROM publication_reactions r WHERE r.publication_id = publication.id AND r.type = 'insightful' AND r.deleted_at IS NULL)`,
        'insightful_count',
      )
      .addSelect(
        `(SELECT COUNT(*) FROM publication_reactions r WHERE r.publication_id = publication.id AND r.type = 'fun' AND r.deleted_at IS NULL)`,
        'fun_count',
      )
      .addSelect(
        `(SELECT COUNT(*) FROM publication_comments c WHERE c.publication_id = publication.id AND c.deleted_at IS NULL)`,
        'comments_count',
      )
      .where('publication.id = :id', { id })
      .andWhere('publication.deletedAt IS NULL');

    // Si hay usuario actual, obtener su reacción
    if (currentUserId) {
      baseQuery.addSelect(
        `(SELECT r.type FROM publication_reactions r WHERE r.publication_id = publication.id AND r.user_id = :currentUserId AND r.deleted_at IS NULL LIMIT 1)`,
        'user_reaction_type',
      );
      baseQuery.setParameter('currentUserId', currentUserId);

      // Filtrar publicaciones privadas
      baseQuery
        .leftJoin(
          'connections',
          'connection',
          '((connection.sender_id = :currentUserId AND connection.receiver_id = publication.userId) OR (connection.receiver_id = :currentUserId AND connection.sender_id = publication.userId)) AND connection.status = :acceptedStatus',
          { currentUserId, acceptedStatus: 'accepted' },
        )
        .andWhere(
          '(publication.privacy = :publicPrivacy OR publication.userId = :currentUserId OR (publication.privacy = :onlyFriendsPrivacy AND connection.id IS NOT NULL))',
          {
            publicPrivacy: 'public',
            onlyFriendsPrivacy: 'onlyFriends',
            currentUserId,
          },
        );
    } else {
      // Si no hay usuario actual, solo mostrar publicaciones públicas
      baseQuery.andWhere('publication.privacy = :publicPrivacy', {
        publicPrivacy: 'public',
      });
    }

    const result = await baseQuery.getRawOne();

    if (!result) {
      return null;
    }

    // Transformar el resultado
    return {
      id: result.publication_id,
      description: result.publication_description,
      mediaUrl: result.publication_mediaUrl,
      mediaType: result.publication_mediaType,
      privacy: result.publication_privacy,
      userId: result.publication_userId,
      createdAt: result.publication_createdAt,
      updatedAt: result.publication_updatedAt,
      isActive: result.publication_isActive,
      deletedAt: result.publication_deletedAt,
      reactionsCount: {
        like: parseInt(result.like_count) || 0,
        love: parseInt(result.love_count) || 0,
        support: parseInt(result.support_count) || 0,
        celebrate: parseInt(result.celebrate_count) || 0,
        insightful: parseInt(result.insightful_count) || 0,
        fun: parseInt(result.fun_count) || 0,
      },
      commentsCount: parseInt(result.comments_count) || 0,
      userReaction: result.user_reaction_type || null,
    };
  }
}
