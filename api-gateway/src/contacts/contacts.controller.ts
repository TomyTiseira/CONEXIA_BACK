import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config';
import { AcceptConnectionDto, SendConnectionRequestDto } from './dto';

@Controller('contacts')
export class ContactsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('send-request')
  @AuthRoles([ROLES.USER])
  sendConnectionRequest(
    @Body() sendConnectionRequestDto: SendConnectionRequestDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      currentUserId: user.id,
      ...sendConnectionRequestDto,
    };

    return this.client.send('sendConnectionRequest', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('requests')
  @AuthRoles([ROLES.USER])
  getConnectionRequests(@User() user: AuthenticatedUser) {
    const payload = {
      userId: user.id,
    };

    return this.client.send('getConnectionRequests', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('accept-request')
  @AuthRoles([ROLES.USER])
  acceptConnection(
    @Body() acceptConnectionDto: AcceptConnectionDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      currentUserId: user.id,

      requestId: acceptConnectionDto.requestId,
    };

    return this.client.send('acceptConnection', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
