import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config';
import {
  AcceptConnectionDto,
  GetSentConnectionRequestsDto,
  SendConnectionRequestDto,
} from './dto';
import { GetFriendsDto } from './dto/get-friends.dto';

@Controller('contacts')
export class ContactsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('recommendations')
  @AuthRoles([ROLES.USER])
  getRecommendations(
    @User() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ) {
    const payload = {
      currentUserId: user.id,
      limit: limit ? parseInt(limit, 10) : 12,
    };
    return this.client.send('getRecommendations', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

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

  @Get('sent-requests')
  @AuthRoles([ROLES.USER])
  getSentConnectionRequests(
    @Query() getSentConnectionRequestsDto: GetSentConnectionRequestsDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      userId: user.id,
      ...getSentConnectionRequestsDto,
    };

    return this.client.send('getSentConnectionRequests', payload).pipe(
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

  @Get('friends/:userId')
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getFriends(
    @Param('userId') userId: string,
    @Query() getFriendsDto: GetFriendsDto,
  ) {
    return this.client
      .send('getFriends', {
        userId: parseInt(userId),
        ...getFriendsDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Delete('connection-request/:requestId')
  @AuthRoles([ROLES.USER])
  deleteConnectionRequest(
    @Param('requestId') requestId: string,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      currentUserId: user.id,
      requestId: parseInt(requestId),
    };

    return this.client.send('deleteConnectionRequest', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
