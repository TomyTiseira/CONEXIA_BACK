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
import { CreatePublicationDto } from './dto/create-publication.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PublicationIdDto } from './dto/publication-id.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';

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
        currentUserId: user.id,
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
}
