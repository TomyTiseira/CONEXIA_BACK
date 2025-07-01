import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { CreateUserDto } from './dto/create-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyUserDto } from './dto/verify-user.dto';

@Controller('users')
export class UsersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('ping')
  ping() {
    return this.client.send('ping', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.client.send('createUser', createUserDto).pipe(
      catchError((error) => {
        console.log(error);
        throw new RpcException(error);
      }),
    );
  }

  @Post('verify')
  verify(@Body() verifyUserDto: VerifyUserDto) {
    return this.client.send('verifyUser', verifyUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('resend-verification')
  resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.client.send('resendVerification', resendVerificationDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
