import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { NATS_SERVICE } from 'src/config';

@Controller('users')
export class UsersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('ping')
  ping() {
    return this.client.send('ping', {}).pipe(
      catchError((error: unknown) => {
        if (error instanceof Error) {
          throw new RpcException(error.message);
        }

        throw new RpcException('Error unknown');
      }),
    );
  }
}
