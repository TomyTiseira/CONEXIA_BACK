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
  CreateCommentReportDto,
  GetCommentReportsDto,
  GetProjectReportsDto,
  GetReportsDto,
  GetServiceReportsDto,
  GetServiceReportsListDto,
  GetUserReviewReportsDto,
  OrderByServiceReport,
  OrderByUserReviewReport,
} from './dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { CreateUserReviewReportDto } from './dto/create-user-review-report.dto';

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

  @Post('user-review')
  @AuthRoles([ROLES.USER])
  createUserReviewReport(
    @Body() createUserReviewReportDto: CreateUserReviewReportDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('createUserReviewReport', {
        createUserReviewReportDto,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('user-review/:userReviewId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getUserReviewReports(
    @Param('userReviewId') userReviewId: string,
    @Query() query: GetUserReviewReportsDto,
  ) {
    return this.client
      .send('getUserReviewReports', {
        userReviewId: parseInt(userReviewId, 10),
        page: query.page || 1,
        limit: query.limit || 10,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('user-review')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getUserReviewsWithReports(@Query() query: GetUserReviewReportsDto) {
    return this.client
      .send('getUserReviewsWithReports', {
        page: query.page || 1,
        limit: query.limit || 10,
        orderBy: query.orderBy || OrderByUserReviewReport.REPORT_COUNT,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post('comment')
  @AuthRoles([ROLES.USER])
  createCommentReport(
    @Body() createCommentReportDto: CreateCommentReportDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('createCommentReport', {
        createReportDto: createCommentReportDto,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('comment/:commentId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getCommentReports(
    @Param('commentId') commentId: string,
    @Query() query: GetCommentReportsDto,
  ) {
    return this.client
      .send('getCommentReports', {
        commentId: parseInt(commentId, 10),
        page: query.page || 1,
        limit: query.limit || 10,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('comment')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getCommentsWithReports(@Query() getCommentReportsDto: GetCommentReportsDto) {
    return this.client
      .send('getCommentsWithReports', {
        page: getCommentReportsDto.page || 1,
        limit: getCommentReportsDto.limit || 10,
        orderBy: getCommentReportsDto.orderBy || 'reportCount',
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
