import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
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

  // TODO: Eliminar estos endpoints
  // Ejemplos de endpoints con validación de roles
  @Get('admin-only')
  @AuthRoles([ROLES.ADMIN])
  getAdminOnlyData() {
    return {
      success: true,
      message: 'Admin only data',
      data: {
        message: 'Only admins can access this endpoint',
        role: 'admin',
      },
    };
  }

  @Get('moderator-only')
  @AuthRoles([ROLES.MODERATOR])
  getModeratorOnlyData() {
    return {
      success: true,
      message: 'Moderator only data',
      data: {
        message: 'Only moderators can access this endpoint',
        role: 'moderator',
      },
    };
  }

  @Get('admin-or-moderator')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getAdminOrModeratorData() {
    return {
      success: true,
      message: 'Admin or Moderator data',
      data: {
        message: 'Admins or moderators can access this endpoint',
        roles: ['admin', 'moderator'],
      },
    };
  }

  @Get('user-data')
  @AuthRoles([ROLES.USER])
  getUserData() {
    return {
      success: true,
      message: 'User data',
      data: {
        message: 'Regular users can access this endpoint',
        role: 'user',
      },
    };
  }
}
