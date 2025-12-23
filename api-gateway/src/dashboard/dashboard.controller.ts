import { Controller, Get, Inject, Res } from '@nestjs/common';
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
        this.client.send<{ plan?: { name?: string } }>('getUserPlan', {
          userId,
        }),
      );

      const userPlan: string =
        (userPlanResponse?.plan?.name as string) || 'Free';

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
        this.client.send<{ plan?: { name?: string } }>('getUserPlan', {
          userId,
        }),
      );

      const userPlan: string =
        (userPlanResponse?.plan?.name as string) || 'Free';

      // Exportar métricas
      const exportResponse = await firstValueFrom(
        this.client.send<{ filename: string; data: string }>(
          'exportServiceMetricsCSV',
          {
            userId,
            userPlan,
          },
        ),
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
  @AuthRoles([ROLES.ADMIN])
  getAdminMetrics() {
    return this.client.send('getAdminDashboardMetrics', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('admin/export')
  @AuthRoles([ROLES.ADMIN])
  async exportAdminMetrics(@Res() res: Response) {
    try {
      const metrics: any = await firstValueFrom(
        this.client.send('getAdminDashboardMetrics', {}),
      );

      // Convertir las métricas a CSV
      const csvData = this.convertMetricsToCSV(metrics);

      // Enviar archivo CSV
      const filename = `admin-metrics-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send('\uFEFF' + csvData); // BOM para UTF-8
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Get('moderator')
  @AuthRoles([ROLES.MODERATOR])
  getModeratorMetrics() {
    return this.client.send('getModeratorDashboardMetrics', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('moderator/export')
  @AuthRoles([ROLES.MODERATOR])
  async exportModeratorMetrics(@Res() res: Response) {
    try {
      const metrics: any = await firstValueFrom(
        this.client.send('getModeratorDashboardMetrics', {}),
      );

      // Convertir las métricas a CSV
      const csvData = this.convertModeratorMetricsToCSV(metrics);

      // Enviar archivo CSV
      const filename = `moderator-metrics-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send('\uFEFF' + csvData); // BOM para UTF-8
    } catch (error) {
      throw new RpcException(error);
    }
  }

  private convertMetricsToCSV(metrics: any): string {
    const lines: string[] = [];

    // Encabezado
    lines.push('MÉTRICAS DEL DASHBOARD ADMINISTRATIVO');
    lines.push('');

    // === USUARIOS ===
    lines.push('USUARIOS');
    lines.push('Categoría,Valor');
    lines.push(`Total de usuarios,${metrics.users.newUsers.total}`);
    lines.push(`Usuarios verificados,${metrics.users.verifiedUsers.verified}`);
    lines.push(
      `Usuarios verificados y activos,${metrics.users.verifiedUsers.verifiedAndActive}`,
    );
    lines.push(
      `Porcentaje de verificación,${metrics.users.verifiedUsers.verificationPercentage}%`,
    );
    lines.push(`Nuevos usuarios (7 días),${metrics.users.newUsers.last7Days}`);
    lines.push(
      `Nuevos usuarios (30 días),${metrics.users.newUsers.last30Days}`,
    );
    lines.push(
      `Nuevos usuarios (90 días),${metrics.users.newUsers.last90Days}`,
    );
    lines.push(
      `Usuarios activos (7 días),${metrics.users.activeUsers.last7Days}`,
    );
    lines.push(
      `Usuarios activos (30 días),${metrics.users.activeUsers.last30Days}`,
    );
    lines.push(
      `Usuarios activos (90 días),${metrics.users.activeUsers.last90Days}`,
    );
    lines.push('');

    // === PROYECTOS ===
    lines.push('PROYECTOS');
    lines.push('Categoría,Valor');
    lines.push(`Total de proyectos,${metrics.projects.totalProjects}`);
    lines.push(`Proyectos activos,${metrics.projects.activeProjects}`);
    lines.push(`Proyectos con postulaciones,${metrics.projects.projectsWithPostulations}`);
    lines.push(`Proyectos con postulación aceptada,${metrics.projects.projectsWithAcceptedPostulation}`);
    lines.push(`Promedio de postulaciones por proyecto,${metrics.projects.averagePostulationsPerProject}`);
    lines.push(`Tasa de engagement,${metrics.projects.projectEngagementRate}%`);
    lines.push(`Nuevos proyectos (7 días),${metrics.projects.newProjectsLast7Days}`);
    lines.push(`Nuevos proyectos (30 días),${metrics.projects.newProjectsLast30Days}`);
    lines.push(`Nuevos proyectos (90 días),${metrics.projects.newProjectsLast90Days}`);
    lines.push(
      `Tasa de aprobación de postulaciones,${metrics.projects.postulationApprovalRate}%`,
    );
    lines.push('');

    // Proyectos por categoría
    lines.push('PROYECTOS POR CATEGORÍA');
    lines.push('Categoría,Total Proyectos,Promedio Postulaciones');
    metrics.projects.projectsByCategory.forEach((cat: any) => {
      lines.push(`${cat.categoryName},${cat.totalProjects},${cat.avgPostulations}`);
    });
    lines.push('');

    // Postulaciones por estado
    lines.push('POSTULACIONES POR ESTADO');
    lines.push('Estado,Cantidad');
    metrics.projects.postulationsByStatus.forEach((status: any) => {
      lines.push(`${status.statusName},${status.count}`);
    });
    lines.push('');

    // === SERVICIOS ===
    lines.push('SERVICIOS');
    lines.push('Categoría,Valor');
    lines.push(
      `Total de servicios contratados,${metrics.services.totalServicesHired}`,
    );
    lines.push(`Ingresos totales,${metrics.services.totalRevenue} ARS`);
    lines.push(`Cotizaciones enviadas,${metrics.services.quotations.sent}`);
    lines.push(
      `Cotizaciones aceptadas,${metrics.services.quotations.accepted}`,
    );
    lines.push(
      `Tasa de aceptación de cotizaciones,${metrics.services.quotations.acceptanceRate}%`,
    );
    lines.push(`Reclamos totales,${metrics.services.claims.totalClaims}`);
    lines.push(`Reclamos resueltos,${metrics.services.claims.resolvedClaims}`);
    lines.push(`Tasa de reclamos,${metrics.services.claims.claimRate}%`);
    lines.push(`Tasa de resolución,${metrics.services.claims.resolutionRate}%`);
    lines.push(
      `Tiempo promedio de resolución,${metrics.services.claims.averageResolutionTimeInHours} horas`,
    );
    lines.push('');

    // Servicios por tipo
    lines.push('SERVICIOS POR TIPO');
    lines.push('Tipo,Cantidad,Ingresos (ARS)');
    metrics.services.byType.forEach((type: any) => {
      lines.push(`${type.type},${type.count},${type.revenue}`);
    });
    lines.push('');

    // === MEMBRESÍAS ===
    lines.push('MEMBRESÍAS');
    lines.push('Plan,Usuarios');
    metrics.memberships.usersByPlan.forEach((plan: any) => {
      lines.push(`${plan.planName},${plan.usersCount}`);
    });
    lines.push('');

    // === REPORTES ===
    lines.push('REPORTES');
    lines.push('Categoría,Valor');
    lines.push(`Total de reportes,${metrics.reports.totalReports}`);
    lines.push('');

    // Reportes por tipo
    lines.push('REPORTES POR TIPO');
    lines.push('Tipo,Cantidad');
    metrics.reports.byType.forEach((type: any) => {
      lines.push(`${type.type},${type.count}`);
    });
    lines.push('');

    // Reportes por motivo
    lines.push('REPORTES POR MOTIVO');
    lines.push('Motivo,Cantidad');
    metrics.reports.byReason.forEach((reason: any) => {
      lines.push(`${reason.reason},${reason.count}`);
    });
    lines.push('');

    lines.push(`Fecha de generación: ${new Date().toLocaleString('es-AR')}`);

    return lines.join('\n');
  }

  private convertModeratorMetricsToCSV(metrics: any): string {
    const lines: string[] = [];

    // Encabezado
    lines.push('MÉTRICAS DEL DASHBOARD DE MODERACIÓN');
    lines.push('');

    // === REPORTES ===
    lines.push('REPORTES');
    lines.push('Categoría,Valor');
    lines.push(`Total de reportes,${metrics.reports.totalReports}`);
    lines.push('');

    // Reportes por estado
    lines.push('REPORTES POR ESTADO');
    lines.push('Estado,Cantidad');
    metrics.reports.byStatus.forEach((status: any) => {
      lines.push(`${status.status},${status.count}`);
    });
    lines.push('');

    // Reportes por tipo
    lines.push('REPORTES POR TIPO');
    lines.push('Tipo,Cantidad');
    metrics.reports.byType.forEach((type: any) => {
      lines.push(`${type.type},${type.count}`);
    });
    lines.push('');

    // Reportes por motivo
    lines.push('REPORTES POR MOTIVO');
    lines.push('Motivo,Cantidad');
    metrics.reports.byReason.forEach((reason: any) => {
      lines.push(`${reason.reason},${reason.count}`);
    });
    lines.push('');

    // === RECLAMOS DE SERVICIOS ===
    lines.push('RECLAMOS DE SERVICIOS');
    lines.push('Categoría,Valor');
    lines.push(`Reclamos totales,${metrics.claims.totalClaims}`);
    lines.push(`Reclamos resueltos,${metrics.claims.resolvedClaims}`);
    lines.push(`Servicios en progreso,${metrics.claims.servicesInProgress}`);
    lines.push(`Total servicios activos,${metrics.claims.totalServicesHired}`);
    lines.push(`Tasa de reclamos,${metrics.claims.claimRate}%`);
    lines.push(`Tasa de resolución,${metrics.claims.resolutionRate}%`);
    lines.push(
      `Tiempo promedio de resolución,${metrics.claims.averageResolutionTimeInHours} horas`,
    );
    lines.push('');

    lines.push(`Fecha de generación: ${new Date().toLocaleString('es-AR')}`);

    return lines.join('\n');
  }
}
