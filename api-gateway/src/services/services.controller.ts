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
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { catchError } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config/service';
import {
  CreateServiceDto,
  DeleteServiceDto,
  GetServicesDto,
  UpdateServiceDto,
} from './dto';

@Controller('services')
export class ServicesController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('ping')
  ping() {
    return this.client.send('ping', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('categories')
  getCategories() {
    return this.client.send('getServiceCategories', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post()
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 5 }], {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'services'),
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo por imagen
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new RpcException({
              status: 400,
              message: 'only images in JPEG or PNG format are allowed.',
            }),
            false,
          );
        }
      },
    }),
  )
  createService(
    @Body() createServiceDto: CreateServiceDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @User() user: AuthenticatedUser,
  ) {
    // Agregar las URLs de las imágenes al DTO si existen
    if (files && files.images && files.images.length > 0) {
      createServiceDto.images = files.images.map(
        (file) => `/uploads/services/${file.filename}`,
      );
    }

    return this.client
      .send('createService', { createServiceDto, userId: user.id })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get()
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
  getServices(
    @Query() getServicesDto: GetServicesDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('getServices', { getServicesDto, currentUserId: user.id })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('profile/:userId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
  getServicesByUser(
    @Param('userId') userId: number,
    @User() user: AuthenticatedUser,
    @Query('includeInactive') includeInactive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const includeInactiveBoolean = includeInactive === 'true';
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;

    return this.client
      .send('getServicesByUser', {
        userId,
        currentUserId: user.id,
        includeInactive: includeInactiveBoolean,
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
  getServiceById(@Param('id') id: number, @User() user: AuthenticatedUser) {
    return this.client
      .send('getServiceById', {
        id,
        currentUserId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Patch(':id')
  @AuthRoles([ROLES.USER])
  updateService(
    @Param('id') id: number,
    @Body() updateServiceDto: UpdateServiceDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('updateService', {
        serviceId: +id,
        userId: user.id,
        price: updateServiceDto.price,
        estimatedHours: updateServiceDto.estimatedHours,
        timeUnit: updateServiceDto.timeUnit,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Delete(':id')
  @AuthRoles([ROLES.USER])
  deleteService(
    @Param('id') id: number,
    @Body() deleteServiceDto: DeleteServiceDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('deleteService', {
        serviceId: +id,
        reason: deleteServiceDto.reason,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
