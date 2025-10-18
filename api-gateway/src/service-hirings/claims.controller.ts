import {
  Body,
  Controller,
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
import { CreateClaimDto, GetClaimsDto, ResolveClaimDto } from './dto';

/**
 * Claims Controller - API Gateway
 * Maneja las peticiones REST y las redirige al microservicio via NATS
 */
@Controller('claims')
export class ClaimsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * POST /claims
   * Crear un nuevo reclamo con evidencias (archivos)
   * Solo usuarios autenticados (cliente o proveedor del hiring)
   *
   * FormData fields:
   * - hiringId: number
   * - claimType: string
   * - description: string (50-2000 chars)
   * - evidence: file[] (max 10 files, 10MB each)
   */
  @Post()
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'evidence', maxCount: 10 }], {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'claims'),
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo por archivo
      fileFilter: (req, file, cb) => {
        // Permitir imágenes, PDFs y documentos
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new RpcException({
              status: 400,
              message:
                'Only images (JPEG, PNG), PDFs, and Word documents are allowed.',
            }),
            false,
          );
        }
      },
    }),
  )
  createClaim(
    @User() user: AuthenticatedUser,
    @Body() createClaimDto: CreateClaimDto,
    @UploadedFiles() files?: { evidence?: Express.Multer.File[] },
  ) {
    // Agregar las URLs de las evidencias al DTO si existen
    if (files && files.evidence && files.evidence.length > 0) {
      createClaimDto.evidenceUrls = files.evidence.map(
        (file) => `/uploads/claims/${file.filename}`,
      );
    }

    return this.client
      .send('createClaim', {
        userId: user.id,
        createClaimDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * GET /claims
   * Listar reclamos con filtros
   * Solo admins/moderadores
   */
  @Get()
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getClaims(@Query() filters: GetClaimsDto) {
    return this.client.send('getClaims', filters).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  /**
   * GET /claims/hiring/:hiringId
   * Obtener reclamos de una contratación específica
   * Usuario debe ser parte del hiring o admin/moderador
   */
  @Get('hiring/:hiringId')
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getClaimsByHiring(@Param('hiringId') hiringId: number) {
    return this.client
      .send('getClaimsByHiring', {
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * GET /claims/:id
   * Obtener un reclamo específico
   * Usuario debe ser parte del hiring o admin/moderador
   */
  @Get(':id')
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getClaimById(@Param('id') id: string) {
    return this.client
      .send('getClaimById', {
        claimId: id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * PATCH /claims/:id/resolve
   * Resolver un reclamo (RESOLVED o REJECTED)
   * Solo admins/moderadores
   */
  @Patch(':id/resolve')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  resolveClaim(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() resolveDto: ResolveClaimDto,
  ) {
    return this.client
      .send('resolveClaim', {
        claimId: id,
        resolvedBy: user.id,
        resolveDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * PATCH /claims/:id/review
   * Marcar un reclamo como "en revisión"
   * Solo admins/moderadores
   */
  @Patch(':id/review')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  markAsInReview(@Param('id') id: string) {
    return this.client
      .send('markClaimAsInReview', {
        claimId: id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
