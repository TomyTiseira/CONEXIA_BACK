/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { catchError, firstValueFrom } from 'rxjs';
import { VerificationToken } from 'src/auth/decorators/token.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AutoRefreshAuth } from 'src/auth/decorators/auto-refresh-auth.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from 'src/config';
import { jwtConfig } from 'src/config/jwt.config';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { CreateProfileHttpDto } from './dto/create-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { AuthenticatedUser } from './interfaces/user.interfaces';

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
  async verify(@Body() verifyUserDto: VerifyUserDto, @Res() res: Response) {
    try {
      const result = (await firstValueFrom(
        this.client.send('verifyUser', verifyUserDto).pipe(
          catchError((error) => {
            throw new RpcException(error);
          }),
        ),
      )) as {
        id: number;
        email: string;
        isValidate: boolean;
        message: string;
        token: string;
      };

      // Configurar cookie con el token de verificación JWT
      res.cookie('user_verification_token', result.token, {
        ...jwtConfig.cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutos
      });

      res.json({
        success: true,
        message: result.message,
        data: {
          user: {
            id: result.id,
            email: result.email,
            isValidate: result.isValidate,
          },
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  @Post('resend-verification')
  resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.client.send('resendVerification', resendVerificationDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Delete()
  @AuthRoles([ROLES.USER])
  delete(
    @Body() deleteUserDto: DeleteUserDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('deleteUser', {
        ...deleteUserDto,
        userId: +user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }



  @Patch('update')
  @AutoRefreshAuth()
  update(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.client
      .send('updateUser', {
        ...updateUserDto,
        userId: req.user?.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('get-role-by-id')
  getRoleById(@Query('id') id: string) {
    return this.client.send('getRoleById', id).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  // TODO: Eliminar estos endpoints
  // Ejemplos de endpoints con validación de roles
  @Get('admin-only')
  @AuthRoles([ROLES.ADMIN])
  getAdminOnlyData() {
    return {
      success: true,
      message: 'Admin only data',
      data: {
        message: 'Only admins can access this endpoint',
        role: 'admin',
      },
    };
  }

  @Get('moderator-only')
  @AuthRoles([ROLES.MODERATOR])
  getModeratorOnlyData() {
    return {
      success: true,
      message: 'Moderator only data',
      data: {
        message: 'Only moderators can access this endpoint',
        role: 'moderator',
      },
    };
  }

  @Get('admin-or-moderator')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getAdminOrModeratorData() {
    return {
      success: true,
      message: 'Admin or Moderator data',
      data: {
        message: 'Admins or moderators can access this endpoint',
        roles: ['admin', 'moderator'],
      },
    };
  }

  @Get('user-data')
  @AuthRoles([ROLES.USER])
  getUserData() {
    return {
      success: true,
      message: 'User data',
      data: {
        message: 'Regular users can access this endpoint',
        role: 'user',
      },
    };
  }

  @Get('profile/:userId')
  @UseGuards(JwtAuthGuard)
  getProfile(@Param('userId') userId: string, @User() user: AuthenticatedUser) {
    // Enviamos tanto el userId del parámetro como los datos del usuario autenticado
    const payload = {
      targetUserId: parseInt(userId),
      authenticatedUser: {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
      },
    };

    return this.client.send('getProfile', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('document-types')
  getDocumentTypes() {
    return this.client.send('findAllDocumentTypes', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('profile')
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
    @Req() req: Request,
    @VerificationToken() token: string,
    @UploadedFiles()
    files: {
      profilePicture?: Express.Multer.File[];
      coverPicture?: Express.Multer.File[];
    } = {},
  ) {
    const body =
      (req.body as {
        experience?: unknown;
        socialLinks?: unknown;
        skills?: unknown;
        [key: string]: any;
      }) ?? {};

    // Parsear manualmente los arrays que vienen como strings JSON
    if (typeof body.experience === 'string') {
      try {
        body.experience = JSON.parse(body.experience);
      } catch {
        body.experience = [];
      }
    }
    if (typeof body.socialLinks === 'string') {
      try {
        body.socialLinks = JSON.parse(body.socialLinks);
      } catch {
        body.socialLinks = [];
      }
    }
    if (typeof body.skills === 'string') {
      try {
        body.skills = JSON.parse(body.skills);
      } catch {
        body.skills = [];
      }
    }

    const dto = plainToInstance(CreateProfileHttpDto, body);
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
      token,
      ...dto,
      profilePicture: files?.profilePicture?.[0]?.filename,
      coverPicture: files?.coverPicture?.[0]?.filename,
    };

    // Retornamos el observable sin usar @Res()
    return this.client.send('createProfile', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
