import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config/service';
import {
  ContractServiceDto,
  CreateQuotationDto,
  CreateServiceHiringDto,
  GetServiceHiringsDto,
} from './dto';

@Controller('service-hirings')
export class ServiceHiringsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  @AuthRoles([ROLES.USER])
  createServiceHiring(
    @User() user: AuthenticatedUser,
    @Body() createDto: CreateServiceHiringDto,
  ) {
    return this.client
      .send('createServiceHiring', {
        userId: user.id,
        createDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/quotation')
  @AuthRoles([ROLES.USER])
  createQuotation(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() quotationDto: CreateQuotationDto,
  ) {
    return this.client
      .send('createQuotation', {
        serviceOwnerId: user.id,
        hiringId: +hiringId,
        quotationDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Put(':hiringId/quotation')
  @AuthRoles([ROLES.USER])
  editQuotation(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() quotationDto: CreateQuotationDto,
  ) {
    return this.client
      .send('editQuotation', {
        serviceOwnerId: user.id,
        hiringId: +hiringId,
        quotationDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get()
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getServiceHirings(@Query() query: GetServiceHiringsDto) {
    return this.client.send('getServiceHirings', query).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('my-requests')
  @AuthRoles([ROLES.USER])
  getMyServiceHirings(
    @User() user: AuthenticatedUser,
    @Query() query: GetServiceHiringsDto,
  ) {
    return this.client
      .send('getServiceHiringsByUser', {
        userId: user.id,
        params: query,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('my-services')
  @AuthRoles([ROLES.USER])
  getMyServiceRequests(
    @User() user: AuthenticatedUser,
    @Query() query: GetServiceHiringsDto,
  ) {
    return this.client
      .send('getServiceHiringsByServiceOwner', {
        serviceOwnerId: user.id,
        params: query,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/accept')
  @AuthRoles([ROLES.USER])
  acceptServiceHiring(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
  ) {
    return this.client
      .send('acceptServiceHiring', {
        userId: user.id,
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/reject')
  @AuthRoles([ROLES.USER])
  rejectServiceHiring(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
  ) {
    return this.client
      .send('rejectServiceHiring', {
        userId: user.id,
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/cancel')
  @AuthRoles([ROLES.USER])
  cancelServiceHiring(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
  ) {
    return this.client
      .send('cancelServiceHiring', {
        userId: user.id,
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/negotiate')
  @AuthRoles([ROLES.USER])
  negotiateServiceHiring(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
  ) {
    return this.client
      .send('negotiateServiceHiring', {
        userId: user.id,
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/contract')
  @AuthRoles([ROLES.USER])
  contractService(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() contractDto: ContractServiceDto,
  ) {
    return this.client
      .send('contractService', {
        userId: user.id,
        hiringId: +hiringId,
        contractDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
