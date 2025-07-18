import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { CreateInternalUserDto } from './dto/create-internal-user.dto';

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
  createInternalUser(@Body() createUserDto: CreateInternalUserDto) {
    return this.client.send('internal-users_create', createUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
