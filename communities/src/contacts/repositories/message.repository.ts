/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Message } from '../entities/message.entity';

@Injectable()
export class MessageRepository {
  constructor(
    @InjectRepository(Message)
    private readonly repository: Repository<Message>,
  ) {}

  async create(data: Partial<Message>): Promise<Message> {
    const message = this.repository.create(data);
    return this.repository.save(message);
  }

  async findByConversationId(
    conversationId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: Message[]; total: number }> {
    const [messages, total] = await this.repository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { messages, total };
  }

  async findByConversationIdCumulative(
    conversationId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: Message[]; total: number; hasMore: boolean }> {
    // Para paginación acumulativa, siempre obtenemos desde el inicio hasta la página actual
    const totalMessages = await this.repository.count({
      where: { conversationId },
    });

    const messages = await this.repository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createdAt', 'ASC')
      .take(page * limit) // Tomamos todos los mensajes hasta la página actual
      .getMany();

    const hasMore = messages.length < totalMessages;

    return {
      messages,
      total: totalMessages,
      hasMore,
    };
  }

  async markAsRead(messageIds: number[], userId: number): Promise<void> {
    if (!messageIds || messageIds.length === 0) {
      return;
    }

    await this.repository.update(
      { id: In(messageIds), receiverId: userId },
      { isRead: true },
    );
  }

  async getUnreadConversationsCount(userId: number): Promise<number> {
    // Contar conversaciones que tienen mensajes no leídos
    const result = await this.repository
      .createQueryBuilder('message')
      .select('COUNT(DISTINCT message.conversationId)', 'count')
      .where('message.receiverId = :userId', { userId })
      .andWhere('message.isRead = false')
      .getRawOne();

    const count = result?.count;
    return Number(count) || 0;
  }

  // Mantener el método original para compatibilidad
  async getUnreadCount(userId: number): Promise<number> {
    return this.getUnreadConversationsCount(userId);
  }

  async findById(id: number): Promise<Message | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['conversation'],
    });
  }

  async getLastMessage(conversationId: number): Promise<Message | null> {
    return this.repository.findOne({
      where: { conversationId },
      order: { createdAt: 'DESC' },
    });
  }
}
