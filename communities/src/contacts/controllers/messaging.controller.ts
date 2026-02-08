import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetConversationsDto } from '../dto/get-conversations.dto';
import { GetMessagesDto } from '../dto/get-messages.dto';
import { MarkMessagesReadDto } from '../dto/mark-messages-read.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ContactsService } from '../services/contacts.service';

@Controller()
export class MessagingController {
  constructor(private readonly contactsService: ContactsService) {}

  @MessagePattern('sendMessage')
  async sendMessage(
    @Payload() data: SendMessageDto & { currentUserId: number },
  ) {
    return this.contactsService.sendMessage(data.currentUserId, data);
  }

  @MessagePattern('getConversations')
  async getConversations(
    @Payload() data: GetConversationsDto & { currentUserId: number },
  ) {
    return this.contactsService.getConversations(data.currentUserId, data);
  }

  @MessagePattern('getMessages')
  async getMessages(
    @Payload() data: GetMessagesDto & { currentUserId: number },
  ) {
    return this.contactsService.getMessages(data.currentUserId, data);
  }

  @MessagePattern('markMessagesAsRead')
  async markMessagesAsRead(
    @Payload()
    data: MarkMessagesReadDto & {
      currentUserId: number;
      conversationId: number;
    },
  ) {
    return this.contactsService.markMessagesAsRead(
      data.currentUserId,
      data.conversationId,
      data,
    );
  }

  @MessagePattern('getUnreadCount')
  async getUnreadCount(@Payload() data: { currentUserId: number }) {
    return this.contactsService.getUnreadCount(data.currentUserId);
  }

  @MessagePattern('getConversationInfo')
  getConversationInfo(@Payload() data: { userId1: number; userId2: number }) {
    return this.contactsService.getConversationInfo(data.userId1, data.userId2);
  }

  @MessagePattern('getMessageById')
  getMessageById(
    @Payload() data: { messageId: number; currentUserId: number },
  ) {
    return this.contactsService.getMessageById(
      data.messageId,
      data.currentUserId,
    );
  }
}
