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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { GetPublicationReactionsDto } from './dto/get-publication-reactions.dto';
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
    FileInterceptor('media', {
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
    @UploadedFile() media: Express.Multer.File,
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
    const mediaData = media
      ? {
          mediaFilename: media.filename,
          mediaSize: media.size,
          mediaType: this.getMediaType(media.mimetype),
          mediaUrl: `/uploads/publications/${media.filename}`,
        }
      : undefined;
    const payload = {
      ...dto,
      ...(mediaData ?? {}),
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
      .send('getPublicationById', {
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
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FileInterceptor('media', {
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
    @UploadedFile() media: Express.Multer.File,
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

    // Solo incluir mediaData si se envía un nuevo archivo
    let mediaData:
      | {
          mediaFilename: string;
          mediaSize: number;
          mediaType: string;
          mediaUrl: string;
        }
      | undefined = undefined;

    if (media) {
      mediaData = {
        mediaFilename: media.filename,
        mediaSize: media.size,
        mediaType: this.getMediaType(media.mimetype),
        mediaUrl: `/uploads/publications/${media.filename}`,
      };
    }
    // Si no se envía media, no se incluye mediaData en el payload
    // Esto mantendrá los valores existentes en la base de datos

    const payload = {
      id: params.id,
      userId: user.id,
      updatePublicationDto: {
        ...dto,
        ...(mediaData && {
          mediaFilename: mediaData.mediaFilename,
          mediaSize: mediaData.mediaSize,
          mediaType: mediaData.mediaType,
          mediaUrl: mediaData.mediaUrl,
        }),
      },
    };
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
  async createComment(
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
  ) {
    const dto = plainToInstance(GetPublicationCommentsDto, {
      publicationId: parseInt(publicationId, 10),
      page: query.page,
      limit: query.limit,
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
    const payload = {
      id: parseInt(id, 10),
      userId: user.id,
      updateCommentDto,
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
  async createReaction(
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
    @Query() query: PaginationDto,
  ) {
    const dto = plainToInstance(GetPublicationReactionsDto, {
      publicationId: parseInt(publicationId, 10),
      page: query.page,
      limit: query.limit,
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
}
