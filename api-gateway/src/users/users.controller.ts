import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { AutoRefreshAuth } from 'src/auth/decorators/auto-refresh-auth.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from 'src/config';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { AuthenticatedUser } from './interfaces/user.interfaces';

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

  @Get('profile/:userId')
  @UseGuards(JwtAuthGuard)
  getProfile(@Param('userId') userId: string, @User() user: AuthenticatedUser) {
    // Enviamos tanto el userId del parámetro como los datos del usuario autenticado
    const payload = {
      targetUserId: parseInt(userId),
      authenticatedUser: {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
      },
    };

    return this.client.send('getProfile', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
