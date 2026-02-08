import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AcceptConnectionDto } from '../dto/accept-connection.dto';
import { DeleteConnectionRequestDto } from '../dto/delete-connection-request.dto';
import { GetConnectionRequestsDto } from '../dto/get-connection-requests.dto';
import { GetFriendsDto } from '../dto/get-friends.dto';
import { GetSentConnectionRequestsDto } from '../dto/get-sent-connection-requests.dto';
import { SendConnectionDto } from '../dto/send-connection-request.dto';
import { ContactsService } from '../services/contacts.service';

@Controller()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @MessagePattern('getRecommendations')
  async getRecommendations(
    @Payload() data: { currentUserId: number; limit?: number },
  ) {
    return this.contactsService.getRecommendations(
      data.currentUserId,
      data.limit ?? 12,
    );
  }

  @MessagePattern('sendConnectionRequest')
  async sendConnectionRequest(
    @Payload() data: SendConnectionDto & { currentUserId: number },
  ) {
    return this.contactsService.sendConnectionRequest(data.currentUserId, data);
  }

  @MessagePattern('getConnectionRequests')
  async getConnectionRequests(@Payload() data: GetConnectionRequestsDto) {
    return this.contactsService.getConnectionRequests(data);
  }

  @MessagePattern('getSentConnectionRequests')
  async getSentConnectionRequests(
    @Payload() data: GetSentConnectionRequestsDto,
  ) {
    return this.contactsService.getSentConnectionRequests(data);
  }

  @MessagePattern('acceptConnection')
  acceptConnection(
    @Payload() data: AcceptConnectionDto & { currentUserId: number },
  ) {
    return this.contactsService.acceptConnection(data.currentUserId, data);
  }

  @MessagePattern('getFriends')
  async getFriends(@Payload() data: GetFriendsDto) {
    return this.contactsService.getFriends(data);
  }

  @MessagePattern('getConnectionStatus')
  getConnectionStatus(@Payload() data: { userId1: number; userId2: number }) {
    return this.contactsService.getConnectionStatus(data.userId1, data.userId2);
  }

  @MessagePattern('getConnectionInfo')
  getConnectionInfo(@Payload() data: { userId1: number; userId2: number }) {
    return this.contactsService.getConnectionInfo(data.userId1, data.userId2);
  }

  @MessagePattern('deleteConnectionRequest')
  deleteConnectionRequest(
    @Payload() data: DeleteConnectionRequestDto & { currentUserId: number },
  ) {
    return this.contactsService.deleteConnectionRequest(
      data.currentUserId,
      data,
    );
  }
}
