import {
  Body,
  Controller,
  Delete,
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
import { validate, ValidationError } from 'class-validator';
import { promises as fs } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { catchError } from 'rxjs';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { RequiresActiveAccount } from 'src/auth/decorators/requires-active-account.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from 'src/common/interfaces/authenticatedRequest.interface';
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
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'evaluationFiles', maxCount: 20 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const base = join(process.cwd(), 'uploads', 'projects');
            // images -> uploads/projects/images
            // evaluation files -> uploads/projects/evaluation
            let dest: string;
            if (file.fieldname === 'image') dest = join(base, 'images');
            else if (file.fieldname === 'evaluationFiles')
              dest = join(base, 'evaluation');
            else dest = base;
            // ensure destination exists
            fs.mkdir(dest, { recursive: true })
              .then(() => cb(null, dest))
              .catch((err) => cb(err, dest));
          },
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const name = uniqueSuffix + extname(file.originalname);
            cb(null, name);
          },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          const allowedImageTypes = ['image/jpeg', 'image/png'];
          const allowedEvaluationTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf',
          ];

          if (file.fieldname === 'image') {
            if (allowedImageTypes.includes(file.mimetype)) cb(null, true);
            else
              cb(
                new RpcException({
                  status: 400,
                  message:
                    'Only images in JPEG or PNG format are allowed for project image.',
                }),
                false,
              );
          } else if (file.fieldname === 'evaluationFiles') {
            if (allowedEvaluationTypes.includes(file.mimetype)) cb(null, true);
            else
              cb(
                new RpcException({
                  status: 400,
                  message:
                    'Only images (JPEG/PNG) or PDF are allowed for evaluation files.',
                }),
                false,
              );
          } else cb(null, true);
        },
      },
    ),
  )
  async publishProject(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      evaluationFiles?: Express.Multer.File[];
    } = {},
    @User() user: AuthenticatedUser,
  ) {
    const body = (req.body as { [key: string]: any }) ?? {};

    // Common parsing helper: if nested objects/arrays are sent as JSON strings in multipart
    const parsedBody: any = { ...body };
    if (typeof parsedBody.roles === 'string') {
      try {
        const parsed = JSON.parse(parsedBody.roles) as unknown;
        // Narrow the parsed value before assigning to avoid unsafe `any` assignment
        if (Array.isArray(parsed)) {
          parsedBody.roles = parsed as Array<Record<string, unknown>>;
        } else {
          parsedBody.roles = parsed as Record<string, unknown>;
        }
      } catch {
        // keep as-is; validation will catch it
      }
    }

    // Attach evaluation files metadata to corresponding roles (by index)
    const evalFiles = files.evaluationFiles ?? [];
    if (Array.isArray(parsedBody.roles)) {
      type RoleWithEvaluation = {
        evaluation?: {
          fileUrl?: string;
          fileName?: string;
          fileSize?: number;
          fileMimeType?: string;
        };
        [key: string]: unknown;
      };

      for (let i = 0; i < parsedBody.roles.length; i++) {
        const role = parsedBody.roles[i] as RoleWithEvaluation;
        const file = evalFiles[i];
        if (file) {
          role.evaluation = role.evaluation ?? {};
          role.evaluation.fileUrl = file.filename;
          role.evaluation.fileName = file.originalname;
          role.evaluation.fileSize = file.size;
          role.evaluation.fileMimeType = file.mimetype;
        }
      }
    }

    // Now transform and validate after attaching file metadata
    const dto = plainToInstance(PublishProjectDto, parsedBody);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const format = (err: ValidationError): any => {
        const out: any = { property: err.property };
        if (err.constraints && Object.keys(err.constraints).length > 0)
          out.constraints = err.constraints;
        if (err.children && err.children.length > 0)
          out.children = err.children.map((c) => format(c));
        return out;
      };

      // Clean up uploaded files on validation error
      const filesToDelete = [
        ...(files.image?.map((f) => f.path) ?? []),
        ...(files.evaluationFiles?.map((f) => f.path) ?? []),
      ];
      await Promise.all(
        filesToDelete.map(async (filePath) => {
          try {
            await import('fs/promises').then((fs) => fs.unlink(filePath));
          } catch {
            // ignore
          }
        }),
      );

      throw new RpcException({
        status: 400,
        message: 'Validation failed',
        errors: errors.map((e) => format(e)),
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
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
  getSkillsByRubro(@Param('rubroId') rubroId: number) {
    return this.client.send('getSkillsByRubro', { rubroId }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('rubros')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
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
