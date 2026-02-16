import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config';

// DTO for new base64 approach
class VerifyIdentityPayloadDto {
  documentImage: {
    fileData: string; // base64
    originalName: string;
    mimeType: string;
  };
  faceImage: {
    fileData: string; // base64
    originalName: string;
    mimeType: string;
  };
  documentType?: string;
}

@Controller('verification')
export class VerificationController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * New base64 approach - clean architecture
   */
  @Post('compare')
  @AuthRoles([ROLES.USER])
  async verifyIdentity(
    @Req() req: AuthenticatedRequest,
    @Body() payload: VerifyIdentityPayloadDto,
  ) {
    try {
      // Validar que se proporcionaron ambas imágenes
      if (!payload.documentImage?.fileData || !payload.faceImage?.fileData) {
        throw new RpcException({
          status: 400,
          message:
            'Debe proporcionar ambas imágenes: documento de identidad y foto del rostro.',
        });
      }

      // Preparar payload para el microservicio
      const microservicePayload = {
        userId: req.user?.id,
        documentImage: {
          fileData: payload.documentImage.fileData,
          originalName: payload.documentImage.originalName,
          mimeType: payload.documentImage.mimeType,
        },
        faceImage: {
          fileData: payload.faceImage.fileData,
          originalName: payload.faceImage.originalName,
          mimeType: payload.faceImage.mimeType,
        },
        documentType: payload.documentType || 'DNI',
      };

      // Enviar al microservicio
      const result = await firstValueFrom(
        this.client.send('verifyIdentity', microservicePayload).pipe(
          catchError((error) => {
            throw new RpcException(error);
          }),
        ),
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: 500,
        message: error.message || 'Error en la verificación de identidad',
      });
    }
  }

  @Get('status')
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getVerificationStatus(@Req() req: AuthenticatedRequest) {
    return this.client
      .send('getVerificationStatus', { userId: req.user?.id })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('history')
  @AuthRoles([ROLES.USER])
  getVerificationHistory(@Req() req: AuthenticatedRequest) {
    return this.client
      .send('getVerificationHistory', { userId: req.user?.id })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('status/:userId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getVerificationStatusByUserId(@Param('userId') userId: string) {
    return this.client
      .send('getVerificationStatus', { userId: parseInt(userId) })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
