import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { AutoRefreshAuth } from '../auth/decorators/auto-refresh-auth.decorator';
import { User } from '../auth/decorators/user.decorator';
import { NATS_SERVICE } from '../config';
import { AuthenticatedUser } from '../users/interfaces/user.interfaces';

@Controller('dashboard')
export class DashboardController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('user')
  @AutoRefreshAuth()
  getUserMetrics(@User() user: AuthenticatedUser) {
    const userId = Number(user.id);

    if (!userId || isNaN(userId)) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid user ID',
      });
    }

    return this.client.send('getUserDashboardMetrics', { userId }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('admin')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getAdminMetrics() {
    return this.client.send('getAdminDashboardMetrics', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
