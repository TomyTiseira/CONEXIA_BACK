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
import { GetProjectReportsDto, GetReportsDto } from './dto';
import { CreateReportDto } from './dto/create-report.dto';

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
    console.log('🚀 API Gateway - Query recibido:', query);
    console.log('🚀 API Gateway - ProjectId del param:', projectId);

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
}
