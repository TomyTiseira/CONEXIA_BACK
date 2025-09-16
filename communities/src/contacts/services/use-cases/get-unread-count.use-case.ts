import { Injectable } from '@nestjs/common';
import { MessageRepository } from '../../repositories/message.repository';

@Injectable()
export class GetUnreadCountUseCase {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(currentUserId: number): Promise<{ unreadCount: number }> {
    // Contar conversaciones que tienen mensajes no leídos
    const unreadCount =
      await this.messageRepository.getUnreadConversationsCount(currentUserId);

    return { unreadCount };
  }
}
