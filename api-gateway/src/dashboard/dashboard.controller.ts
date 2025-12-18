import { Controller, Get, Inject, Query, Res } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Response } from 'express';
import { catchError, firstValueFrom } from 'rxjs';
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

  @Get('user/services')
  @AutoRefreshAuth()
  async getUserServiceMetrics(@User() user: AuthenticatedUser) {
    const userId = Number(user.id);

    if (!userId || isNaN(userId)) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid user ID',
      });
    }

    try {
      // Obtener el plan del usuario desde memberships
      const userPlanResponse = await firstValueFrom(
        this.client.send<{ plan?: { name?: string } }>('getUserPlan', { userId }),
      );

      const userPlan: string = (userPlanResponse?.plan?.name as string) || 'Free';

      // Obtener métricas de servicios con el plan del usuario
      return await firstValueFrom(
        this.client.send('getServiceMetricsByUser', {
          userId,
          userPlan,
        }),
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Get('user/services/export')
  @AutoRefreshAuth()
  async exportUserServiceMetrics(
    @User() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const userId = Number(user.id);

    if (!userId || isNaN(userId)) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid user ID',
      });
    }

    try {
      // Obtener el plan del usuario
      const userPlanResponse = await firstValueFrom(
        this.client.send<{ plan?: { name?: string } }>('getUserPlan', { userId }),
      );

      const userPlan: string = (userPlanResponse?.plan?.name as string) || 'Free';

      // Exportar métricas
      const exportResponse = await firstValueFrom(
        this.client.send<{ filename: string; data: string }>('exportServiceMetricsCSV', {
          userId,
          userPlan,
        }),
      );

      // Enviar archivo CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${exportResponse.filename}"`,
      );
      res.send(exportResponse.data);
    } catch (error) {
      throw new RpcException(error);
    }
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
