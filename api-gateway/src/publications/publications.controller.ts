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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FilesInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { catchError } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { GetPublicationCommentsDto } from './dto/get-publication-comments.dto';
import {
  GetPublicationReactionsDto,
  ReactionType,
} from './dto/get-publication-reactions.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PublicationIdDto } from './dto/publication-id.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { UpdateReactionDto } from './dto/update-reaction.dto';

@Controller('publications')
export class PublicationsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('ping')
  ping() {
    return this.client.send('ping', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FilesInterceptor('media', 5, {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'publications'),
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'video/mp4',
          'image/gif',
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new RpcException({
              status: 400,
              message: 'only JPG, PNG, MP4 or GIF files are allowed.',
            }),
            false,
          );
        }
      },
    }),
  )
  async createPublication(
    @Body() createPublicationDto: CreatePublicationDto,
    @UploadedFiles() media: Express.Multer.File[],
    @User() user: AuthenticatedUser,
  ) {
    const dto = plainToInstance(CreatePublicationDto, createPublicationDto);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new RpcException({
        status: 400,
        message: 'Validation failed',
        errors: errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
          children: e.children,
        })),
      });
    }

    // Validar límites de archivos
    if (media && media.length > 0) {
      // Validar máximo 5 archivos
      if (media.length > 5) {
        throw new RpcException({
          status: 400,
          message: 'Maximum 5 files allowed per publication',
        });
      }

      // Validar máximo 1 video
      const videoFiles = media.filter((file) =>
        file.mimetype.startsWith('video/'),
      );
      if (videoFiles.length > 1) {
        throw new RpcException({
          status: 400,
          message: 'Maximum 1 video file allowed per publication',
        });
      }
    }

    // Procesar archivos múltiples
    const mediaArray =
      media && media.length > 0
        ? media.map((file, index) => ({
            filename: file.filename,
            fileUrl: `/uploads/publications/${file.filename}`,
            fileType: file.mimetype,
            fileSize: file.size,
            displayOrder: index + 1,
          }))
        : undefined;

    // Preparar payload - usar SOLO el nuevo formato para múltiples archivos
    const payload = {
      ...dto,
      media: mediaArray,
      userId: user.id,
    };
    return this.client.send('createPublication', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get()
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getPublications(
    @User() user: AuthenticatedUser,
    @Query() query: PaginationDto,
  ) {
    return this.client
      .send('getPublications', {
        currentUserId: user.id,
        ...query,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get(':id')
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getPublicationById(
    @Param() params: PublicationIdDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('getPublicationDetail', {
        id: params.id,
        currentUserId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('profile/:userId')
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getUserPublications(
    @Param('userId') userId: number,
    @User() user: AuthenticatedUser,
    @Query() query: PaginationDto,
  ) {
    return this.client
      .send('getUserPublications', {
        userId: Number(userId),
        currentUserId: user.id, // Pasamos el ID del usuario actual
        ...query,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FilesInterceptor('media', 5, {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'publications'),
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'video/mp4',
          'image/gif',
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new RpcException({
              status: 400,
              message: 'only JPG, PNG, MP4 or GIF files are allowed.',
            }),
            false,
          );
        }
      },
    }),
  )
  async editPublication(
    @Param() params: PublicationIdDto,
    @Body() updatePublicationDto: UpdatePublicationDto,
    @UploadedFiles() media: Express.Multer.File[],
    @User() user: AuthenticatedUser,
  ) {
    const dto = plainToInstance(UpdatePublicationDto, updatePublicationDto);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new RpcException({
        status: 400,
        message: 'Validation failed',
        errors: errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
          children: e.children,
        })),
      });
    }

    // Validar límites de archivos nuevos si los hay
    if (media && media.length > 0) {
      // Validar máximo 5 archivos totales (se validará en el backend con archivos existentes)
      if (media.length > 5) {
        throw new RpcException({
          status: 400,
          message: 'Maximum 5 files allowed per publication',
        });
      }

      // Validar máximo 1 video
      const videoFiles = media.filter((file) =>
        file.mimetype.startsWith('video/'),
      );
      if (videoFiles.length > 1) {
        throw new RpcException({
          status: 400,
          message: 'Maximum 1 video file allowed per publication',
        });
      }
    }

    // Procesar nuevos archivos si los hay
    const newMediaArray =
      media && media.length > 0
        ? media.map((file, index) => ({
            filename: file.filename,
            fileUrl: `/uploads/publications/${file.filename}`,
            fileType: file.mimetype,
            fileSize: file.size,
            displayOrder: index + 1, // Se reordenará en el backend
          }))
        : undefined;

    const payload = {
      id: params.id,
      userId: user.id,
      updatePublicationDto: {
        ...dto,
        media: newMediaArray,
      },
    };
    // Si se solicita eliminar el archivo y la publicación ya existe
    // Esto se manejará en el microservicio, no necesitamos hacer nada especial aquí
    // excepto enviar el flag removeMedia

    return this.client.send('editPublication', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Delete(':id')
  @AuthRoles([ROLES.USER])
  deletePublication(
    @Param() params: PublicationIdDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      id: params.id,
      userId: user.id,
    };
    return this.client.send('deletePublication', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  // Endpoint para eliminar archivo específico de una publicación
  @Delete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.USER])
  deletePublicationMedia(
    @Param('id') publicationId: string,
    @Param('mediaId') mediaId: string,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      id: parseInt(publicationId, 10),
      userId: user.id,
      updatePublicationDto: {
        removeMediaIds: [parseInt(mediaId, 10)],
      },
    };

    return this.client.send('editPublication', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  private getMediaType(mimetype: string): string {
    if (mimetype.startsWith('image/')) {
      return mimetype === 'image/gif' ? 'gif' : 'image';
    }
    if (mimetype === 'video/mp4') {
      return 'video';
    }
    return 'image';
  }

  // Endpoints para comentarios
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.USER])
  createComment(
    @Param('id') publicationId: string,
    @Body() createCommentDto: CreateCommentDto,
    @User() user: AuthenticatedUser,
  ) {
    // Creamos un nuevo objeto para enviar al microservicio
    const payload = {
      content: createCommentDto.content,
      publicationId: parseInt(publicationId, 10),
      userId: user.id,
    };

    // Ya no necesitamos validar con el DTO porque pasamos los campos directamente

    return this.client.send('createComment', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  async getPublicationComments(
    @Param('id') publicationId: string,
    @Query() query: PaginationDto,
    @User() user: AuthenticatedUser,
    @Query('sort') sort?: string,
  ) {
    const dto = plainToInstance(GetPublicationCommentsDto, {
      publicationId: parseInt(publicationId, 10),
      page: query.page,
      limit: query.limit,
      sort,
      currentUserId: user?.id,
    });

    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new RpcException({
        status: 400,
        message: 'Validation failed',
        errors: errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
        })),
      });
    }

    return this.client.send('getPublicationComments', dto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.USER])
  updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @User() user: AuthenticatedUser,
  ) {
    // Creamos un payload simple para el servicio de communities
    const payload = {
      id: parseInt(id, 10),
      userId: user.id,
      content: updateCommentDto.content,
    };

    return this.client.send('editComment', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.USER])
  deleteComment(@Param('id') id: string, @User() user: AuthenticatedUser) {
    const payload = {
      id: parseInt(id, 10),
      userId: user.id,
    };

    return this.client.send('deleteComment', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  // Endpoints para reacciones
  @Post(':id/reactions')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.USER])
  createReaction(
    @Param('id') publicationId: string,
    @Body() createReactionDto: CreateReactionDto,
    @User() user: AuthenticatedUser,
  ) {
    // Creamos un nuevo objeto para enviar al microservicio
    const payload = {
      type: createReactionDto.type,
      publicationId: parseInt(publicationId, 10),
      userId: user.id,
    };

    return this.client.send('createReaction', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get(':id/reactions')
  @UseGuards(JwtAuthGuard)
  async getPublicationReactions(
    @Param('id') publicationId: string,
    @User() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: ReactionType,
  ) {
    const dto = plainToInstance(GetPublicationReactionsDto, {
      publicationId: parseInt(publicationId, 10),
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
      currentUserId: user?.id,
    });

    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new RpcException({
        status: 400,
        message: 'Validation failed',
        errors: errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
        })),
      });
    }

    return this.client.send('getPublicationReactions', dto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Patch('reactions/:id')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.USER])
  updateReaction(
    @Param('id') id: string,
    @Body() updateReactionDto: UpdateReactionDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      id: parseInt(id, 10),
      userId: user.id,
      updateReactionDto,
    };

    return this.client.send('editReaction', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Delete('reactions/:id')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.USER])
  deleteReaction(@Param('id') id: string, @User() user: AuthenticatedUser) {
    const payload = {
      id: parseInt(id, 10),
      userId: user.id,
    };

    return this.client.send('deleteReaction', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  // Endpoints para migración de datos legacy (solo para desarrollo/administración)
  @Post('admin/migrate-legacy-media')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.ADMIN])
  migrateLegacyMedia() {
    return this.client.send('migrateLegacyMedia', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('admin/cleanup-legacy-fields')
  @UseGuards(JwtAuthGuard)
  @AuthRoles([ROLES.ADMIN])
  cleanupLegacyFields() {
    return this.client.send('cleanupLegacyFields', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
