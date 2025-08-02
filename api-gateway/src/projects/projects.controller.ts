/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { catchError } from 'rxjs';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config';
import { GetProjectsDto } from './dtos/get-projects.dto';
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
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }], {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const name = uniqueSuffix + extname(file.originalname);
          cb(null, name);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new RpcException({
              status: 400,
              message: 'Only images in JPEG or PNG format are allowed.',
            }),
            false,
          );
        }
      },
    }),
  )
  async publishProject(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
    } = {},
    @User() user: AuthenticatedUser,
  ) {
    const body = (req.body as { [key: string]: any }) ?? {};

    const dto = plainToInstance(PublishProjectDto, body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      // Lanzamos una excepción HTTP con los errores de validación
      throw new RpcException({
        status: 400,
        message: 'Validation failed',
        errors: errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
        })),
      });
    }

    // Validación manual de tipos de archivo
    const allowedTypes = ['image/jpeg', 'image/png'];
    let isValid = true;
    const filesToDelete: string[] = [];

    if (files.image?.[0]) {
      if (!allowedTypes.includes(files.image[0].mimetype)) {
        isValid = false;
      } else {
        filesToDelete.push(files.image[0].path);
      }
    }

    if (!isValid) {
      // Borra todos los archivos guardados
      await Promise.all(
        filesToDelete.map(async (filePath) => {
          try {
            await import('fs/promises').then((fs) => fs.unlink(filePath));
          } catch {
            // ignorar errores
          }
        }),
      );
      throw new RpcException({
        status: 400,
        message: 'Only images in JPEG or PNG format are allowed.',
      });
    }

    const payload = {
      ...dto,
      userId: user.id,
      image: files?.image?.[0]?.filename,
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

  @Get('profile/:userId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
  getProjectsByUser(
    @Param('userId') userId: number,
    @User() user: AuthenticatedUser,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const includeDeletedBoolean = includeDeleted === 'true';

    return this.client
      .send('getProjectsByUser', {
        userId,
        currentUserId: user.id,
        includeDeleted: includeDeletedBoolean,
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

  @Get('collaboration-types')
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
