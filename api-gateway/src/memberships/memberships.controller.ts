/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { NATS_SERVICE } from 'src/config';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { CreatePlanDto } from './dto/create-plan.dto';
import { TogglePlanDto } from './dto/toggle-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('memberships')
export class MembershipsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('ping')
  ping() {
    return this.client.send('memberships_ping', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('benefits')
  @AuthRoles([ROLES.ADMIN, ROLES.USER])
  getBenefits() {
    return this.client.send('getBenefits', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('plans')
  @AuthRoles([ROLES.ADMIN])
  createPlan(@Body() body: CreatePlanDto, @User() user: AuthenticatedUser) {
    const payload = { ...body, adminUserId: user.id };
    return this.client.send('createPlan', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('plans')
  @AuthRoles([ROLES.ADMIN, ROLES.USER])
  getPlans(@Query('includeInactive') includeInactive?: string) {
    const payload = {
      includeInactive: includeInactive === 'true',
    };
    return this.client.send('getPlans', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('plans/:id')
  @AuthRoles([ROLES.ADMIN, ROLES.USER])
  getPlanById(
    @Param('id') id: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const payload = {
      id: +id,
      includeInactive: includeInactive === 'true',
    };
    return this.client.send('getPlanById', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Patch('plans/:id')
  @AuthRoles([ROLES.ADMIN])
  updatePlan(
    @Param('id') id: string,
    @Body() body: UpdatePlanDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      ...body,
      id: +id,
      adminUserId: user.id,
    };
    return this.client.send('updatePlan', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Patch('plans/:id/toggle')
  @AuthRoles([ROLES.ADMIN])
  togglePlan(
    @Param('id') id: string,
    @Body() body: TogglePlanDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      id: +id,
      active: body.active,
      adminUserId: user.id,
    };
    return this.client.send('togglePlan', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Delete('plans/:id')
  @AuthRoles([ROLES.ADMIN])
  deletePlan(@Param('id') id: string, @User() user: AuthenticatedUser) {
    const payload = { id: +id, adminUserId: user.id };
    return this.client.send('deletePlan', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
