import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { AutoRefreshAuth } from 'src/auth/decorators/auto-refresh-auth.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from 'src/config';
import { CreateUserDto } from './dto/create-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

  @Patch('update')
  @AutoRefreshAuth()
  update(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.client
      .send('updateUser', {
        ...updateUserDto,
        userId: req.user?.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('get-role-by-id')
  getRoleById(@Query('id') id: number) {
    return this.client.send('getRoleById', id).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
