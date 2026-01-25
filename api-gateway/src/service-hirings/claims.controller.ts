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
import { ROLES, ROLES_IDS } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config/service';
import {
  CreateClaimDto,
  GetClaimsDto,
  ResolveClaimDto,
  UpdateClaimDto,
} from './dto';

/**
 * Claims Controller - API Gateway
 * Maneja las peticiones REST y las redirige al microservicio via NATS
 */
@Controller('claims')
export class ClaimsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * GET /claims/my-claims
   * Lista los reclamos donde el usuario es parte (reclamante o reclamado)
   */
  @Get('my-claims')
  @AuthRoles([ROLES.USER])
  getMyClaims(
    @User() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('role') role?: 'claimant' | 'respondent' | 'all',
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const filters = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
      status,
      role: role || 'all',
      sortBy: sortBy || 'updatedAt',
      sortOrder: sortOrder || 'desc',
    };

    return this.client.send('getMyClaims', { userId: user.id, filters }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  /**
   * POST /claims
   * Crear un nuevo reclamo con evidencias (archivos)
   * Solo usuarios autenticados (cliente o proveedor del hiring)
   *
   * FormData fields:
   * - hiringId: number
   * - claimType: string
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
   * Endpoint público - no requiere autenticación
   */
  @Get(':id')
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
   * GET /claims/:id/detail
   * Detalle completo del reclamo (usuario debe ser parte o staff)
   */
  @Get(':id/detail')
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getClaimDetail(@User() user: AuthenticatedUser, @Param('id') id: string) {
    const isStaff =
      user.roleId === ROLES_IDS.ADMIN || user.roleId === ROLES_IDS.MODERATOR;
    return this.client
      .send('getClaimDetail', {
        claimId: id,
        requesterId: user.id,
        isStaff,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * POST /claims/:id/observations
   * Observaciones del reclamado (solo si status=OPEN)
   */
  @Post(':id/observations')
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'evidenceFiles', maxCount: 5 }], {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'claims'),
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
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
              message: 'Solo se permiten imágenes, PDFs y documentos Word.',
            }),
            false,
          );
        }
      },
    }),
  )
  submitRespondentObservations(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('observations') observations: string,
    @UploadedFiles() files?: { evidenceFiles?: Express.Multer.File[] },
  ) {
    const evidenceUrls = (files?.evidenceFiles || []).map(
      (file) => `/uploads/claims/${file.filename}`,
    );

    return this.client
      .send('submitRespondentObservations', {
        claimId: id,
        userId: user.id,
        dto: {
          observations,
          evidenceUrls: evidenceUrls.length ? evidenceUrls : null,
        },
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * POST /claims/:id/compliance/submit
   * Subir cumplimiento asociado a un reclamo (resuelve compliance internamente)
   */
  @Post(':id/compliance/submit')
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'evidenceFiles', maxCount: 5 }], {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'compliances'),
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
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
              message: 'Solo se permiten imágenes, PDFs y documentos Word.',
            }),
            false,
          );
        }
      },
    }),
  )
  submitComplianceByClaim(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('description') description: string,
    @UploadedFiles() files?: { evidenceFiles?: Express.Multer.File[] },
  ) {
    const evidenceUrls = (files?.evidenceFiles || []).map(
      (file) => `/uploads/compliances/${file.filename}`,
    );

    return this.client
      .send('submitComplianceByClaim', {
        claimId: id,
        userId: String(user.id),
        userNotes: description || null,
        evidenceUrls: evidenceUrls.length ? evidenceUrls : null,
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
  markAsInReview(@User() user: AuthenticatedUser, @Param('id') id: string) {
    return this.client
      .send('markClaimAsInReview', {
        claimId: id,
        moderatorId: user.id,
        moderatorEmail: user.email,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * PATCH /claims/:id/observations
   * Agregar observaciones a un reclamo (cambia estado a PENDING_CLARIFICATION)
   * Solo admins/moderadores
   */
  @Patch(':id/observations')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  addObservations(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: { observations: string },
  ) {
    return this.client
      .send('addClaimObservations', {
        claimId: id,
        moderatorId: user.id,
        dto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * PATCH /claims/:id/update
   * Subsanar un reclamo (actualizar respuesta a observaciones y/o evidencias)
   * Solo el denunciante (cliente o proveedor) puede subsanar
   * Solo disponible para reclamos en estado PENDING_CLARIFICATION
   *
   * FormData fields:
   * - clarificationResponse: string (opcional, 50-2000 chars) - Respuesta a las observaciones del moderador
   * - evidence: file[] (opcional, máximo 5 archivos por subsanación)
   */
  @Patch(':id/update')
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'evidence', maxCount: 5 }], {
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
        // Permitir imágenes, PDFs, documentos, videos y GIFs
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'video/mp4',
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new RpcException({
              status: 400,
              message:
                'Solo se permiten imágenes (JPEG, PNG, GIF), PDFs, documentos Word y videos MP4.',
            }),
            false,
          );
        }
      },
    }),
  )
  updateClaim(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { clarificationResponse?: string },
    @UploadedFiles() files?: { evidence?: Express.Multer.File[] },
  ) {
    const updateDto: UpdateClaimDto = {};

    // Agregar respuesta de subsanación si se proporciona
    if (body.clarificationResponse) {
      updateDto.clarificationResponse = body.clarificationResponse;
    }

    // Agregar las URLs de las nuevas evidencias si existen
    if (files && files.evidence && files.evidence.length > 0) {
      updateDto.clarificationEvidenceUrls = files.evidence.map(
        (file) => `/uploads/claims/${file.filename}`,
      );
    }

    return this.client
      .send('updateClaim', {
        claimId: id,
        userId: user.id,
        updateDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * PATCH /claims/:id/cancel
   * Cancelar un reclamo (solo el denunciante) mientras no esté cerrado.
   */
  @Patch(':id/cancel')
  @AuthRoles([ROLES.USER])
  cancelClaim(@User() user: AuthenticatedUser, @Param('id') id: string) {
    return this.client
      .send('cancelClaim', {
        claimId: id,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
