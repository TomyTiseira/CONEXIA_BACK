import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { RpcExceptionFilter } from 'src/common/filters/rpc-exception.filter';
import { AuthenticatedUser } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from 'src/config';
import { User } from '../auth/decorators/user.decorator';
import { CreatePublicationReportDto, GetPublicationReportsDto } from './dto';

@Controller('publication-reports')
@UseFilters(RpcExceptionFilter)
export class PublicationReportsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  @AuthRoles([ROLES.USER])
  createPublicationReport(
    @Body() createReportDto: CreatePublicationReportDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('createPublicationReport', {
        createReportDto,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get()
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getPublicationReports(@Query() getReportsDto: GetPublicationReportsDto) {
    return this.client
      .send('getPublicationReports', {
        page: getReportsDto.page || 1,
        limit: getReportsDto.limit || 10,
        orderBy: getReportsDto.orderBy || 'reportCount',
        publicationId: getReportsDto.publicationId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
