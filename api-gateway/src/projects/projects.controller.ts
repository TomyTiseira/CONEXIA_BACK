import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { AuthenticatedUser } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config';
import { PublishProjectDto } from './dtos/publish-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('ping')
  ping() {
    return this.client.send('ping', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @AuthRoles([ROLES.USER])
  @Post('publish')
  publishProject(
    @Body() publishProjectDto: PublishProjectDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('publishProject', {
        ...publishProjectDto,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('categories')
  getCategories() {
    return this.client.send('getCategories', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('V')
  getCollaborationTypes() {
    return this.client.send('getCollaborationTypes', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('contract-types')
  getContractTypes() {
    return this.client.send('getContractTypes', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
