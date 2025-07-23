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
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { AuthenticatedUser } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from 'src/config';
import { CreateInternalUserDto } from './dto/create-internal-user.dto';
import { GetInternalUsersDto } from './dto/get-internal-users.dto';

@Controller('internal-users')
export class InternalUsersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('roles')
  getRoles() {
    // Llama al microservicio para obtener los roles en formato key/value
    return this.client.send('internal-users_get_roles ', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post()
  @AuthRoles([ROLES.ADMIN])
  createInternalUser(@Body() createUserDto: CreateInternalUserDto) {
    return this.client.send('internal-users_create', createUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get()
  @AuthRoles([ROLES.ADMIN])
  getInternalUsers(@Query() getInternalUsersDto: GetInternalUsersDto) {
    return this.client.send('internal-users_get_all', getInternalUsersDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Delete(':id')
  @AuthRoles([ROLES.ADMIN])
  deleteInternalUser(@Param('id') id: string, @User() user: AuthenticatedUser) {
    return this.client
      .send('internal-users_delete', { id: +id, userId: user.id })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
