import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AcceptConnectionDto } from '../dto/accept-connection.dto';
import { GetConnectionRequestsDto } from '../dto/get-connection-requests.dto';
import { SendConnectionDto } from '../dto/send-connection-request.dto';
import { ContactsService } from '../services/contacts.service';

@Controller()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

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

  @MessagePattern('acceptConnection')
  acceptConnection(
    @Payload() data: AcceptConnectionDto & { currentUserId: number },
  ) {
    return this.contactsService.acceptConnection(data.currentUserId, data);
  }
}
