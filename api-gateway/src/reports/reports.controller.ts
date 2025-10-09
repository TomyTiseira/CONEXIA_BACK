import {
  Body,
  Controller,
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
import { AuthenticatedUser } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from 'src/config';
import { User } from '../auth/decorators/user.decorator';
import {
  GetProjectReportsDto,
  GetReportsDto,
  GetServiceReportsDto,
  GetServiceReportsListDto,
  OrderByServiceReport,
} from './dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateServiceReportDto } from './dto/create-service-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('project')
  @AuthRoles([ROLES.USER])
  createProjectReport(
    @Body() createReportDto: CreateReportDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('createProjectReport', {
        createReportDto,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('project/:projectId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getProjectReports(
    @Param('projectId') projectId: string,
    @Query() query: GetProjectReportsDto,
  ) {
    return this.client
      .send('getProjectReports', {
        projectId: parseInt(projectId, 10),
        page: query.page || 1,
        limit: query.limit || 10,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('project')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getProjectsWithReports(@Query() getReportsDto: GetReportsDto) {
    return this.client
      .send('getProjectsWithReports', {
        page: getReportsDto.page || 1,
        limit: getReportsDto.limit || 10,
        orderBy: getReportsDto.orderBy || 'reportCount',
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post('service')
  @AuthRoles([ROLES.USER])
  createServiceReport(
    @Body() createServiceReportDto: CreateServiceReportDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('createServiceReport', {
        createServiceReportDto,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('service/:serviceId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getServiceReports(
    @Param('serviceId') serviceId: string,
    @Query() query: GetServiceReportsDto,
  ) {
    return this.client
      .send('getServiceReports', {
        serviceId: parseInt(serviceId, 10),
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('service')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getServicesWithReports(
    @Query() getServiceReportsListDto: GetServiceReportsListDto,
  ) {
    return this.client
      .send('getServicesWithReports', {
        page: getServiceReportsListDto.page ?? 1,
        limit: getServiceReportsListDto.limit ?? 10,
        orderBy:
          getServiceReportsListDto.orderBy ?? OrderByServiceReport.REPORT_COUNT,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
