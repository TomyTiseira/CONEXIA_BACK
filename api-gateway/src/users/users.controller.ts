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
import { GetUsersDto } from './dto/get-users.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UpdateProfileHttpDto } from './dto/update-profile.dto';
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

  @Get()
  getUsers(@Query() getUsersDto: GetUsersDto) {
    return this.client.send('getUsers', getUsersDto).pipe(
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
        data: {
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        };
        id: number;
        email: string;
        isValidate: boolean;
        message: string;
      };

      // Configurar cookies
      res.cookie('access_token', result.data.accessToken, {
        ...jwtConfig.cookieOptions,
        maxAge: result.data.expiresIn * 1000,
      });

      res.cookie('refresh_token', result.data.refreshToken, {
        ...jwtConfig.cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
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
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
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
  @AuthRoles([ROLES.USER])
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
    @Req() req: AuthenticatedRequest,
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
        education?: unknown;
        certifications?: unknown;
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
    if (typeof body.education === 'string') {
      try {
        body.education = JSON.parse(body.education);
      } catch {
        body.education = [];
      }
    }
    if (typeof body.certifications === 'string') {
      try {
        body.certifications = JSON.parse(body.certifications);
      } catch {
        body.certifications = [];
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
      userId: req.user?.id,
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

  @Patch('profile')
  @AuthRoles([ROLES.USER])
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
  async updateProfile(
    @Req() req: AuthenticatedRequest,
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
        education?: unknown;
        certifications?: unknown;
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
    if (typeof body.education === 'string') {
      try {
        body.education = JSON.parse(body.education);
      } catch {
        body.education = [];
      }
    }
    if (typeof body.certifications === 'string') {
      try {
        body.certifications = JSON.parse(body.certifications);
      } catch {
        body.certifications = [];
      }
    }

    const dto = plainToInstance(UpdateProfileHttpDto, body);
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

    // Verificar si se envió una petición completamente vacía (sin archivos ni datos)
    const hasFiles = files.profilePicture?.[0] || files.coverPicture?.[0];
    const hasData = Object.keys(dto).some((key) => dto[key] !== undefined);

    if (!hasFiles && !hasData) {
      throw new RpcException({
        status: 400,
        message: 'No data provided for update',
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
      userId: req.user?.id,
      ...dto,
      profilePicture: files?.profilePicture?.[0]?.filename,
      coverPicture: files?.coverPicture?.[0]?.filename,
    };

    return this.client.send('updateProfile', payload).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('skills')
  getSkills() {
    return this.client.send('getSkills', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('localities')
  getLocalities() {
    return this.client.send('getLocalities', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
