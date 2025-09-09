import { Injectable } from '@nestjs/common';
import { AcceptConnectionDto } from '../dto/accept-connection.dto';
import { GetConnectionRequestsDto } from '../dto/get-connection-requests.dto';
import { GetConversationsDto } from '../dto/get-conversations.dto';
import { GetFriendsDto } from '../dto/get-friends.dto';
import { GetMessagesDto } from '../dto/get-messages.dto';
import { MarkMessagesReadDto } from '../dto/mark-messages-read.dto';
import { SendConnectionDto } from '../dto/send-connection-request.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ConnectionStatus } from '../entities/connection.entity';
import {
  AcceptConnectionUseCase,
  GetConnectionInfoUseCase,
  GetConnectionRequestsUseCase,
  GetConnectionStatusUseCase,
  GetConversationsUseCase,
  GetFriendsUseCase,
  GetMessagesUseCase,
  GetUnreadCountUseCase,
  MarkMessagesReadUseCase,
  SendConnectionRequestUseCase,
  SendMessageUseCase,
} from './use-cases';
import { ConnectionInfo } from './use-cases/get-connection-info.use-case';

@Injectable()
export class ContactsService {
  constructor(
    private readonly sendConnectionRequestUseCase: SendConnectionRequestUseCase,
    private readonly getConnectionRequestsUseCase: GetConnectionRequestsUseCase,
    private readonly acceptConnectionUseCase: AcceptConnectionUseCase,
    private readonly getFriendsUseCase: GetFriendsUseCase,
    private readonly getConnectionStatusUseCase: GetConnectionStatusUseCase,
    private readonly getConnectionInfoUseCase: GetConnectionInfoUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getConversationsUseCase: GetConversationsUseCase,
    private readonly getMessagesUseCase: GetMessagesUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    private readonly markMessagesReadUseCase: MarkMessagesReadUseCase,
  ) {}

  async sendConnectionRequest(currentUserId: number, data: SendConnectionDto) {
    return this.sendConnectionRequestUseCase.execute(currentUserId, data);
  }

  async getConnectionRequests(data: GetConnectionRequestsDto) {
    return this.getConnectionRequestsUseCase.execute(data);
  }

  acceptConnection(currentUserId: number, data: AcceptConnectionDto) {
    return this.acceptConnectionUseCase.execute(currentUserId, data);
  }

  async getFriends(data: GetFriendsDto) {
    return await this.getFriendsUseCase.execute(data);
  }

  async getConnectionStatus(
    userId1: number,
    userId2: number,
  ): Promise<ConnectionStatus | null> {
    return await this.getConnectionStatusUseCase.execute(userId1, userId2);
  }

  async getConnectionInfo(
    userId1: number,
    userId2: number,
  ): Promise<ConnectionInfo | null> {
    return await this.getConnectionInfoUseCase.execute(userId1, userId2);
  }

  async sendMessage(currentUserId: number, data: SendMessageDto) {
    return this.sendMessageUseCase.execute(currentUserId, data);
  }

  async getConversations(currentUserId: number, data: GetConversationsDto) {
    return this.getConversationsUseCase.execute(currentUserId, data);
  }

  async getMessages(currentUserId: number, data: GetMessagesDto) {
    return this.getMessagesUseCase.execute(currentUserId, data);
  }

  async markMessagesAsRead(
    currentUserId: number,
    conversationId: number,
    data: MarkMessagesReadDto,
  ) {
    return this.markMessagesReadUseCase.execute(
      currentUserId,
      conversationId,
      data,
    );
  }

  async getUnreadCount(currentUserId: number) {
    return await this.getUnreadCountUseCase.execute(currentUserId);
  }
}
