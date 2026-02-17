import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { RequiresActiveAccount } from '../auth/decorators/requires-active-account.decorator';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config/service';
import {
  CreateServiceDto,
  DeleteServiceDto,
  GetServicesDto,
  UpdateServiceDto,
} from './dto';

@Controller('services')
export class ServicesController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('ping')
  ping() {
    return this.client.send('ping', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('categories')
  getCategories() {
    return this.client.send('getServiceCategories', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post()
  @RequiresActiveAccount([ROLES.USER]) // ⭐ Usuarios suspendidos no pueden crear servicios
  createService(
    @Body() createServiceDto: CreateServiceDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('createService', { createServiceDto, userId: user.id })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get()
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
  getServices(
    @Query() getServicesDto: GetServicesDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('getServices', { getServicesDto, currentUserId: user.id })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('profile/:userId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
  getServicesByUser(
    @Param('userId') userId: number,
    @User() user: AuthenticatedUser,
    @Query('includeInactive') includeInactive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const includeInactiveBoolean = includeInactive === 'true';
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;

    return this.client
      .send('getServicesByUser', {
        userId,
        currentUserId: user.id,
        includeInactive: includeInactiveBoolean,
        page: pageNumber,
        limit: limitNumber,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get(':id')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
  getServiceById(@Param('id') id: number, @User() user: AuthenticatedUser) {
    return this.client
      .send('getServiceById', {
        id,
        currentUserId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Patch(':id')
  @AuthRoles([ROLES.USER])
  updateService(
    @Param('id') id: number,
    @Body() updateServiceDto: UpdateServiceDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('updateService', {
        serviceId: +id,
        userId: user.id,
        price: updateServiceDto.price,
        estimatedHours: updateServiceDto.estimatedHours,
        timeUnit: updateServiceDto.timeUnit,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Delete(':id')
  @AuthRoles([ROLES.USER])
  deleteService(
    @Param('id') id: number,
    @Body() deleteServiceDto: DeleteServiceDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('deleteService', {
        serviceId: +id,
        reason: deleteServiceDto.reason,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
