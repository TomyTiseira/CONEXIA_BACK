import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
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
          const name = uniqueSuffix + extname(file.originalname);
          cb(null, name);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB para videos
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
  createPublication(
    @Body() createPublicationDto: CreatePublicationDto,
    @UploadedFile() media: Express.Multer.File,
    @User() user: AuthenticatedUser,
  ) {
    const mediaData = media
      ? {
          mediaFilename: media.filename,
          mediaSize: media.size,
          mediaType: this.getMediaType(media.mimetype),
          mediaUrl: `/uploads/publications/${media.filename}`,
        }
      : undefined;

    const payload = {
      createPublicationDto: {
        ...createPublicationDto,
        ...mediaData,
      },
      userId: user.id,
    };

    return this.client.send('createPublication', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get()
  getPublications() {
    return this.client.send('getPublications', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get(':id')
  getPublicationById(@Body() data: { id: number }) {
    return this.client.send('getPublicationById', data).pipe(
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
