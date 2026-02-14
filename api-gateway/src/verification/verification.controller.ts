import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { promises as fs } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { catchError, firstValueFrom } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config';

@Controller('verification')
export class VerificationController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('compare')
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'documentImage', maxCount: 1 },
        { name: 'faceImage', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: join(process.cwd(), 'uploads', 'verification'),
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const name = uniqueSuffix + extname(file.originalname);
            cb(null, name);
          },
        }),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
        fileFilter: (req, file, cb) => {
          const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
          if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new RpcException({
                status: 400,
                message:
                  'Solo se permiten imágenes en formato JPEG, JPG o PNG.',
              }),
              false,
            );
          }
        },
      },
    ),
  )
  async verifyIdentity(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles()
    files: {
      documentImage?: Express.Multer.File[];
      faceImage?: Express.Multer.File[];
    },
    @Body() body: { documentType?: string },
  ) {
    try {
      // Validar que se subieron ambas imágenes
      if (!files.documentImage || !files.faceImage) {
        // Limpiar archivos si se subieron
        await this.cleanupFiles(files);

        throw new RpcException({
          status: 400,
          message:
            'Debe subir ambas imágenes: documento de identidad y foto del rostro.',
        });
      }

      const documentImage = files.documentImage[0];
      const faceImage = files.faceImage[0];

      // Preparar payload para el microservicio
      const payload = {
        userId: req.user?.id,
        documentImage: {
          path: documentImage.path,
          filename: documentImage.filename,
          mimetype: documentImage.mimetype,
        },
        faceImage: {
          path: faceImage.path,
          filename: faceImage.filename,
          mimetype: faceImage.mimetype,
        },
        documentType: body.documentType || 'DNI',
      };

      // Enviar al microservicio
      const result = await firstValueFrom(
        this.client.send('verifyIdentity', payload).pipe(
          catchError((error) => {
            throw new RpcException(error);
          }),
        ),
      );

      // Limpiar archivos después del procesamiento
      await this.cleanupFiles(files);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // Limpiar archivos en caso de error
      await this.cleanupFiles(files);

      throw error;
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

  /**
   * Helper para limpiar archivos subidos
   */
  private async cleanupFiles(files: {
    documentImage?: Express.Multer.File[];
    faceImage?: Express.Multer.File[];
  }): Promise<void> {
    const filesToDelete: string[] = [];

    if (files.documentImage?.[0]?.path) {
      filesToDelete.push(files.documentImage[0].path);
    }
    if (files.faceImage?.[0]?.path) {
      filesToDelete.push(files.faceImage[0].path);
    }

    await Promise.all(
      filesToDelete.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          // Ignorar errores al eliminar archivos
          console.error(`Error deleting file ${filePath}:`, error);
        }
      }),
    );
  }
}
