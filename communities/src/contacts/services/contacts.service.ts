import { Injectable } from '@nestjs/common';
import { AcceptConnectionDto } from '../dto/accept-connection.dto';
import { GetConnectionRequestsDto } from '../dto/get-connection-requests.dto';
import { GetFriendsDto } from '../dto/get-friends.dto';
import { SendConnectionDto } from '../dto/send-connection-request.dto';
import { ConnectionStatus } from '../entities/connection.entity';
import {
  AcceptConnectionUseCase,
  GetConnectionInfoUseCase,
  GetConnectionRequestsUseCase,
  GetConnectionStatusUseCase,
  GetFriendsUseCase,
  SendConnectionRequestUseCase,
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
}
