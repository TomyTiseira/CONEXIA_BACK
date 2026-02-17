import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { catchError, firstValueFrom } from 'rxjs';
import { ROLES, ROLES_IDS } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { FileStorage } from '../common/domain/interfaces/file-storage.interface';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config/service';

/**
 * Compliances Controller - API Gateway
 * Maneja las peticiones REST de compliance y las redirige al microservicio via NATS
 */
@Controller('compliances')
export class CompliancesController {
  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    @Inject('DELIVERY_FILE_STORAGE')
    private readonly deliveryStorage: FileStorage,
  ) {}

  /**
   * GET /compliances
   * Obtener lista de compliances con filtros y paginación
   * Acceso: Usuarios autenticados
   */
  @Get()
  @AuthRoles([ROLES.USER, ROLES.MODERATOR])
  async getCompliances(
    @Query('claimId') claimId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('onlyOverdue') onlyOverdue?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @User() user?: AuthenticatedUser,
  ) {
    const query = {
      claimId,
      userId: userId || (user?.id != null ? String(user.id) : undefined),
      status,
      onlyOverdue: onlyOverdue === 'true',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };

    return await firstValueFrom(
      this.client.send('getCompliances', query).pipe(
        catchError((error) => {
          throw error;
        }),
      ),
    );
  }

  /**
   * GET /compliances/:id
   * Obtener detalle de un compliance específico
   * Acceso: Usuario responsable, contraparte o moderador
   */
  @Get(':id')
  @AuthRoles([ROLES.USER, ROLES.MODERATOR])
  async getComplianceById(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: AuthenticatedUser,
  ) {
    return await firstValueFrom(
      this.client
        .send('getComplianceById', { id, userId: String(user.id) })
        .pipe(
          catchError((error) => {
            throw error;
          }),
        ),
    );
  }

  /**
   * POST /compliances/:id/submit
   * Usuario envía evidencia de cumplimiento
   * Acceso: Usuario responsable del compliance
   * FormData fields:
   * - userResponse: string (opcional) - Notas del usuario
   * - evidenceUrls: string[] (opcional)
   * - evidence: file[] (max 10 archivos, 10MB cada uno)
   */
  @Post(':id/submit')
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'evidence', maxCount: 10 }], {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
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
          cb(null, false);
        }
      },
    }),
  )
  async submitCompliance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userResponse') userResponse?: string,
    @Body('evidenceUrls') evidenceUrls?: string,
    @UploadedFiles() files?: { evidence?: Express.Multer.File[] },
    @User() user?: AuthenticatedUser,
  ) {
    // Upload files to storage (GCS in prod, local in dev)
    const uploadedFiles = files?.evidence || [];
    const fileUrls: string[] = [];

    for (const file of uploadedFiles) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = extname(file.originalname);
      const filename = `compliances/${id}/${uniqueSuffix}${extension}`;

      const fileUrl = await this.deliveryStorage.upload(
        file.buffer,
        filename,
        file.mimetype,
      );
      fileUrls.push(fileUrl);
    }

    // Combinar URLs de evidencia
    const existingUrls = evidenceUrls
      ? typeof evidenceUrls === 'string'
        ? [evidenceUrls]
        : evidenceUrls
      : [];
    const allEvidenceUrls = [...existingUrls, ...fileUrls];

    const dto = {
      complianceId: id,
      userId: user?.id != null ? String(user.id) : undefined,
      userNotes: userResponse || null,
      evidenceUrls: allEvidenceUrls.length > 0 ? allEvidenceUrls : null,
    };

    return await firstValueFrom(
      this.client.send('submitCompliance', dto).pipe(
        catchError((error) => {
          throw error;
        }),
      ),
    );
  }

  /**
   * POST /compliances/:id/peer-review
   * La contraparte revisa el compliance (pre-aprobación o pre-rechazo)
   * Acceso: Contraparte del responsable
   */
  @Post(':id/peer-review')
  @AuthRoles([ROLES.USER])
  async peerReviewCompliance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('approved') approved: boolean,
    @Body('reason') reason?: string,
    @User() user?: AuthenticatedUser,
  ) {
    const dto = {
      complianceId: id,
      userId: user?.id != null ? String(user.id) : undefined,
      approved,
      reason: reason || null,
    };

    return await firstValueFrom(
      this.client.send('peerReviewCompliance', dto).pipe(
        catchError((error) => {
          throw error;
        }),
      ),
    );
  }

  /**
   * POST /compliances/:id/review
   * Moderador toma decisión final sobre el compliance
   * Acceso: Solo moderadores y administradores
   */
  @Post(':id/review')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  async moderatorReviewCompliance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('decision') decision: 'approve' | 'reject' | 'adjust',
    @Body('moderatorNotes') moderatorNotes?: string,
    @Body('rejectionReason') rejectionReason?: string,
    @Body('adjustmentInstructions') adjustmentInstructions?: string,
    @User() user?: AuthenticatedUser,
  ) {
    const dto = {
      complianceId: id,
      moderatorId: user?.id != null ? String(user.id) : undefined,
      decision,
      moderatorNotes: moderatorNotes || null,
      rejectionReason: rejectionReason || null,
      adjustmentInstructions: adjustmentInstructions || null,
    };

    return await firstValueFrom(
      this.client.send('moderatorReviewCompliance', dto).pipe(
        catchError((error) => {
          throw error;
        }),
      ),
    );
  }

  /**
   * GET /compliances/stats/:userId
   * Obtener estadísticas de compliances de un usuario
   * Acceso: Mismo usuario o moderador
   */
  @Get('stats/:userId')
  @AuthRoles([ROLES.USER, ROLES.MODERATOR])
  async getUserComplianceStats(
    @Param('userId') userId: string,
    @User() user: AuthenticatedUser,
  ) {
    const targetUserId = String(userId);
    const requesterUserId = String(user.id);

    const isModeratorOrAdmin =
      user.roleId === ROLES_IDS.MODERATOR || user.roleId === ROLES_IDS.ADMIN;

    // Validar que el usuario solo vea sus propias stats o sea moderador
    if (requesterUserId !== targetUserId && !isModeratorOrAdmin) {
      throw new ForbiddenException('No autorizado para ver estas estadísticas');
    }

    return await firstValueFrom(
      this.client.send('getUserComplianceStats', { userId: targetUserId }).pipe(
        catchError((error) => {
          throw error;
        }),
      ),
    );
  }
}
