import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSearchService } from '../../common/services/user-search.service';
import { Conversation } from '../entities/conversation.entity';

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectRepository(Conversation)
    private readonly repository: Repository<Conversation>,
    private readonly userSearchService: UserSearchService,
  ) {}

  async create(data: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.repository.create(data);
    return this.repository.save(conversation);
  }

  async findByUsers(
    user1Id: number,
    user2Id: number,
  ): Promise<Conversation | null> {
    // Asegurar que user1Id < user2Id para mantener consistencia
    const [minId, maxId] = [user1Id, user2Id].sort((a, b) => a - b);

    return this.repository.findOne({
      where: {
        user1Id: minId,
        user2Id: maxId,
      },
    });
  }

  async findByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const [conversations, total] = await this.repository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .where(
        'conversation.user1Id = :userId OR conversation.user2Id = :userId',
        { userId },
      )
      .orderBy('conversation.updatedAt', 'DESC')
      .addOrderBy('messages.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { conversations, total };
  }

  async findByUserIdCumulative(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    conversations: Conversation[];
    total: number;
    hasMore: boolean;
  }> {
    // Obtener el total de conversaciones
    const total = await this.repository
      .createQueryBuilder('conversation')
      .where(
        'conversation.user1Id = :userId OR conversation.user2Id = :userId',
        { userId },
      )
      .getCount();

    // Obtener todas las conversaciones hasta la página actual (acumulativo)
    const conversations = await this.repository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .where(
        'conversation.user1Id = :userId OR conversation.user2Id = :userId',
        { userId },
      )
      .orderBy('conversation.updatedAt', 'DESC')
      .addOrderBy('messages.createdAt', 'DESC')
      .take(page * limit)
      .getMany();

    const hasMore = conversations.length < total;

    return { conversations, total, hasMore };
  }

  async findById(id: number): Promise<Conversation | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['messages'],
    });
  }

  async updateLastMessage(conversationId: number): Promise<void> {
    await this.repository.update(conversationId, {
      updatedAt: new Date(),
    });
  }

  async findByUserIdWithSearch(
    userId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{
    conversations: Conversation[];
    total: number;
    hasMore: boolean;
  }> {
    // Si no hay búsqueda, usar el método normal
    if (!search || !search.trim()) {
      return this.findByUserIdCumulative(userId, page, limit);
    }

    // Buscar usuarios que coincidan con el término de búsqueda
    const matchingUsers = await this.userSearchService.searchUsers(
      search.trim(),
    );
    const matchingUserIds = matchingUsers.map((user) => user.id);

    // Si no hay usuarios que coincidan, devolver resultado vacío
    if (matchingUserIds.length === 0) {
      return { conversations: [], total: 0, hasMore: false };
    }

    // Obtener el total de conversaciones con los usuarios que coinciden
    const total = await this.repository
      .createQueryBuilder('conversation')
      .where(
        '(conversation.user1Id = :userId OR conversation.user2Id = :userId)',
        { userId },
      )
      .andWhere(
        '(conversation.user1Id IN (:...matchingUserIds) OR conversation.user2Id IN (:...matchingUserIds))',
        { matchingUserIds },
      )
      .getCount();

    // Obtener las conversaciones filtradas
    const conversations = await this.repository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .where(
        '(conversation.user1Id = :userId OR conversation.user2Id = :userId)',
        { userId },
      )
      .andWhere(
        '(conversation.user1Id IN (:...matchingUserIds) OR conversation.user2Id IN (:...matchingUserIds))',
        { matchingUserIds },
      )
      .orderBy('conversation.updatedAt', 'DESC')
      .addOrderBy('messages.createdAt', 'DESC')
      .take(page * limit)
      .getMany();

    const hasMore = conversations.length < total;

    return { conversations, total, hasMore };
  }
}
