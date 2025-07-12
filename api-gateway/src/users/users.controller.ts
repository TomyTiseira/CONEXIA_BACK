import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { catchError } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NATS_SERVICE } from 'src/config';
import { CreateProfileHttpDto } from './dto/create-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyUserDto } from './dto/verify-user.dto';

@Controller('users')
export class UsersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('ping')
  ping() {
    return this.client.send('ping', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.client.send('createUser', createUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('verify')
  verify(@Body() verifyUserDto: VerifyUserDto) {
    return this.client.send('verifyUser', verifyUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('resend-verification')
  resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.client.send('resendVerification', resendVerificationDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  // TODO: Eliminar este endpoint
  // Para probar la autenticación
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  getProtectedData() {
    return {
      success: true,
      message: 'This is protected data',
      data: {
        message: 'You have access to this protected endpoint',
      },
    };
  }

  @Get('document-types')
  getDocumentTypes() {
    return this.client.send('findAllDocumentTypes', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post(':userId/profile')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePicture', maxCount: 1 },
        { name: 'coverPicture', maxCount: 1 },
      ],
      {
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
      },
    ),
  )
  async createProfile(
    @Param('userId') userId: string,
    @Body() dto: CreateProfileHttpDto,
    @UploadedFiles()
    files: {
      profilePicture?: Express.Multer.File[];
      coverPicture?: Express.Multer.File[];
    } = {},
  ) {
    // Validación de tipos de archivo
    const allowedTypes = ['image/jpeg', 'image/png'];
    let isValid = true;
    const filesToDelete: string[] = [];

    if (files.profilePicture?.[0]) {
      if (!allowedTypes.includes(files.profilePicture[0].mimetype)) {
        isValid = false;
      } else {
        filesToDelete.push(files.profilePicture[0].path);
      }
    }
    if (files.coverPicture?.[0]) {
      if (!allowedTypes.includes(files.coverPicture[0].mimetype)) {
        isValid = false;
      } else {
        filesToDelete.push(files.coverPicture[0].path);
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
        message:
          'Only images in JPEG or PNG format are allowed in both fields.',
      });
    }

    const payload = {
      userId: +userId,
      ...dto,
      profilePicture: files?.profilePicture?.[0]?.filename,
      coverPicture: files?.coverPicture?.[0]?.filename,
    };
    return this.client.send('createProfile', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
