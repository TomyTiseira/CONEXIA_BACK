import {
  Body,
  Controller,
  Delete,
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
import { RequiresActiveAccount } from 'src/auth/decorators/requires-active-account.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { AuthenticatedUser } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config';
import { DeleteProjectDto } from './dtos/delete-project.dto';
import { GetProjectsDto } from './dtos/get-projects.dto';
import { ApplicationType, PublishProjectDto } from './dtos/publish-project.dto';

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

  @RequiresActiveAccount([ROLES.USER]) // ⭐ Usuarios suspendidos no pueden publicar proyectos
  @Post('publish')
  publishProject(
    @Body() publishProjectDto: PublishProjectDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      ...publishProjectDto,
      userId: user.id,
    };

    return this.client.send('publishProject', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get()
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
  getProjects(
    @Query() getProjectsDto: GetProjectsDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('getProjects', { getProjectsDto, currentUserId: user.id })
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

  @Get('collaboration-types')
  getCollaborationTypes() {
    return this.client.send('getCollaborationTypes', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('application-types')
  getApplicationTypes() {
    // Return enum values as an array of objects with a display name and the key used by the API
    const displayNames: Record<string, string> = {
      CV: 'CV',
      QUESTIONS: 'Preguntas',
      EVALUATION: 'Evaluación Técnica',
    };

    return Object.values(ApplicationType).map((key) => ({
      name: displayNames[key as string] ?? key,
      key,
    }));
  }

  @Get('contract-types')
  getContractTypes() {
    return this.client.send('getContractTypes', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('skills/rubro/:rubroId')
  getSkillsByRubro(@Param('rubroId') rubroId: number) {
    return this.client.send('getSkillsByRubro', { rubroId }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('rubros')
  getRubros() {
    return this.client.send('getRubros', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('profile/:userId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
  getProjectsByUser(
    @Param('userId') userId: number,
    @User() user: AuthenticatedUser,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const includeDeletedBoolean = includeDeleted === 'true';
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;

    return this.client
      .send('getProjectsByUser', {
        userId,
        currentUserId: user.id,
        includeDeleted: includeDeletedBoolean,
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
  getProjectById(@Param('id') id: number, @User() user: AuthenticatedUser) {
    return this.client
      .send('getProjectById', {
        id,
        currentUserId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get(':id/statistics')
  @AuthRoles([ROLES.USER])
  getProjectStatistics(
    @Param('id') id: number,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('getProjectPostulationsStats', {
        projectId: +id,
        userId: +user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Delete(':id')
  @AuthRoles([ROLES.USER])
  deleteProject(
    @Param('id') id: string,
    @Body() deleteProjectDto: DeleteProjectDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('deleteProject', {
        projectId: +id,
        reason: deleteProjectDto.reason,
        userId: +user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
