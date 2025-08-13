/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Inject,
  Post,
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
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config';
import { ApprovePostulationDto } from './dto/approve-postulation.dto';
import { CreatePostulationDto } from './dto/create-postulation.dto';

@Controller('postulations')
export class PostulationsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @AuthRoles([ROLES.USER])
  @Post('apply')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'cv', maxCount: 1 }], {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'cv'),
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const name = uniqueSuffix + extname(file.originalname);
          cb(null, name);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new RpcException({
              status: 400,
              message: 'Only PDF files are allowed for CV',
            }),
            false,
          );
        }
      },
    }),
  )
  async createPostulation(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles()
    files: {
      cv?: any[];
    } = {},
    @User() user: AuthenticatedUser,
  ) {
    const body = (req.body as { [key: string]: any }) ?? {};

    const dto = plainToInstance(CreatePostulationDto, body);
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

    // Validar que se haya enviado el CV
    if (!files.cv?.[0]) {
      throw new RpcException({
        status: 400,
        message: 'CV file is required',
      });
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(files?.cv?.[0].mimetype)) {
      // Borrar archivo subido
      try {
        await import('fs/promises').then((fs) =>
          fs.unlink(files?.cv?.[0].path),
        );
      } catch {
        // ignorar errores
      }
      throw new RpcException({
        status: 400,
        message: 'Only PDF files are allowed for CV',
      });
    }

    const payload = {
      createPostulationDto: {
        ...dto,
        cvUrl: `/uploads/cv/${files.cv[0].filename}`,
        cvFilename: files.cv[0].originalname,
        cvSize: files.cv[0].size,
      },
      currentUserId: user.id,
    };

    return this.client.send('createPostulation', payload).pipe(
      catchError(async (error) => {
        // En caso de error, borrar el archivo subido
        if (files.cv?.[0]) {
          try {
            await import('fs/promises').then((fs) =>
              fs.unlink(files?.cv?.[0].path),
            );
          } catch {
            // ignorar errores
          }
        }
        throw new RpcException(error);
      }),
    );
  }

  @AuthRoles([ROLES.USER])
  @Post('approve')
  approvePostulation(
    @User() user: AuthenticatedUser,
    @Body() dto: ApprovePostulationDto,
  ) {
    return this.client
      .send('approvePostulation', {
        currentUserId: user.id,
        postulationId: dto.postulationId,
      })
      .pipe(
        catchError((error) => {
          console.error('Error in approvePostulation:', error);
          throw new RpcException(error);
        }),
      );
  }
}
