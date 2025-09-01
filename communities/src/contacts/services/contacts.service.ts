import { Injectable } from '@nestjs/common';
import { AcceptConnectionDto } from '../dto/accept-connection.dto';
import { GetConnectionRequestsDto } from '../dto/get-connection-requests.dto';
import { SendConnectionDto } from '../dto/send-connection-request.dto';
import {
  AcceptConnectionUseCase,
  GetConnectionRequestsUseCase,
  SendConnectionRequestUseCase,
} from './use-cases';

@Injectable()
export class ContactsService {
  constructor(
    private readonly sendConnectionRequestUseCase: SendConnectionRequestUseCase,
    private readonly getConnectionRequestsUseCase: GetConnectionRequestsUseCase,
    private readonly acceptConnectionUseCase: AcceptConnectionUseCase,
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
}
