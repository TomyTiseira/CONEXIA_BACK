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
import { ContractPlanDto } from './dto/contract-plan.dto';
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

  @Get('me/plan')
  @AuthRoles([ROLES.USER])
  getMyPlan(@User() user: AuthenticatedUser) {
    return this.client.send('getUserPlan', { userId: user.id }).pipe(
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

  // Subscriptions
  @Post('contract-plan')
  @AuthRoles([ROLES.USER])
  contractPlan(@Body() body: ContractPlanDto, @User() user: AuthenticatedUser) {
    // Mapear roleId a nombre de rol
    const roleMap: Record<number, string> = {
      1: 'admin',
      2: 'user',
      3: 'moderator',
    };

    const payload = {
      userId: user.id,
      userEmail: user.email,
      userRole: roleMap[user.roleId] || 'user',
      dto: body,
    };
    return this.client.send('contractPlan', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
