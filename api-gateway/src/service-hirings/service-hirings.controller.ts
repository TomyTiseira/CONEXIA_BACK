import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { catchError } from 'rxjs';
import { FileStorage } from '../common/domain/interfaces/file-storage.interface';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { RequiresActiveAccount } from '../auth/decorators/requires-active-account.decorator';
import { User } from '../auth/decorators/user.decorator';
import { RpcExceptionFilter } from '../common/filters/rpc-exception.filter';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config/service';
import {
  ContractServiceDto,
  CreateDeliveryDto,
  CreateQuotationDto,
  CreateQuotationWithDeliverablesDto,
  CreateServiceHiringDto,
  GetServiceHiringsDto,
  NegotiateServiceHiringDto,
  ReviewDeliveryDto,
  UpdatePaymentStatusDto,
} from './dto';

@Controller('service-hirings')
@UseFilters(RpcExceptionFilter)
export class ServiceHiringsController {
  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    @Inject('DELIVERY_FILE_STORAGE')
    private readonly deliveryStorage: FileStorage,
  ) {}

  @Post()
  @RequiresActiveAccount([ROLES.USER]) // ⭐ Usuarios suspendidos no pueden solicitar cotizaciones
  createServiceHiring(
    @User() user: AuthenticatedUser,
    @Body() createDto: CreateServiceHiringDto,
  ) {
    return this.client
      .send('createServiceHiring', {
        userId: user.id,
        createDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/quotation')
  @AuthRoles([ROLES.USER])
  createQuotation(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() quotationDto: CreateQuotationDto,
  ) {
    return this.client
      .send('createQuotation', {
        serviceOwnerId: user.id,
        hiringId: +hiringId,
        quotationDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Put(':hiringId/quotation')
  @AuthRoles([ROLES.USER])
  editQuotation(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() quotationDto: CreateQuotationDto,
  ) {
    return this.client
      .send('editQuotation', {
        serviceOwnerId: user.id,
        hiringId: +hiringId,
        quotationDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/quotation-with-deliverables')
  @AuthRoles([ROLES.USER])
  createQuotationWithDeliverables(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() quotationDto: CreateQuotationWithDeliverablesDto,
  ) {
    return this.client
      .send('createQuotationWithDeliverables', {
        serviceOwnerId: user.id,
        hiringId: +hiringId,
        quotationDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Put(':hiringId/quotation-with-deliverables')
  @AuthRoles([ROLES.USER])
  editQuotationWithDeliverables(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() quotationDto: CreateQuotationWithDeliverablesDto,
  ) {
    return this.client
      .send('editQuotationWithDeliverables', {
        serviceOwnerId: user.id,
        hiringId: +hiringId,
        quotationDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('payment-modalities')
  @AuthRoles([ROLES.USER])
  getPaymentModalities() {
    return this.client.send('getPaymentModalities', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get()
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getServiceHirings(@Query() query: GetServiceHiringsDto) {
    return this.client.send('getServiceHirings', query).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('my-requests')
  @AuthRoles([ROLES.USER])
  getMyServiceHirings(
    @User() user: AuthenticatedUser,
    @Query() query: GetServiceHiringsDto,
  ) {
    return this.client
      .send('getServiceHiringsByUser', {
        userId: user.id,
        params: query,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('my-services')
  @AuthRoles([ROLES.USER])
  getMyServiceRequests(
    @User() user: AuthenticatedUser,
    @Query() query: GetServiceHiringsDto,
  ) {
    return this.client
      .send('getServiceHiringsByServiceOwner', {
        serviceOwnerId: user.id,
        params: query,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get(':id')
  @AuthRoles([ROLES.USER])
  getServiceHiringById(
    @User() user: AuthenticatedUser,
    @Param('id') hiringId: number,
  ) {
    return this.client
      .send('getServiceHiringById', {
        userId: user.id,
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/accept')
  @AuthRoles([ROLES.USER])
  acceptServiceHiring(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
  ) {
    return this.client
      .send('acceptServiceHiring', {
        userId: user.id,
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/reject')
  @AuthRoles([ROLES.USER])
  rejectServiceHiring(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
  ) {
    return this.client
      .send('rejectServiceHiring', {
        userId: user.id,
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/cancel')
  @AuthRoles([ROLES.USER])
  cancelServiceHiring(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
  ) {
    return this.client
      .send('cancelServiceHiring', {
        userId: user.id,
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/negotiate')
  @AuthRoles([ROLES.USER])
  negotiateServiceHiring(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() negotiateDto: NegotiateServiceHiringDto,
  ) {
    return this.client
      .send('negotiateServiceHiring', {
        userId: user.id,
        hiringId: +hiringId,
        negotiateDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/request-requote')
  @AuthRoles([ROLES.USER])
  requestRequote(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
  ) {
    return this.client
      .send('requestRequote', {
        userId: user.id,
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/contract')
  @AuthRoles([ROLES.USER])
  contractService(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() contractDto: ContractServiceDto,
  ) {
    return this.client
      .send('contractService', {
        userId: user.id,
        hiringId: +hiringId,
        contractDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':hiringId/retry-payment')
  @AuthRoles([ROLES.USER])
  retryPayment(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
  ) {
    return this.client
      .send('retryPayment', {
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post(':id/payment-status')
  @AuthRoles([ROLES.USER])
  updatePaymentStatus(
    @Param('id') hiringId: number,
    @Body() paymentStatusDto: UpdatePaymentStatusDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('updatePaymentStatus', {
        userId: user.id,
        hiringId,
        paymentStatusDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('debug/mercadopago-account')
  @AuthRoles([ROLES.ADMIN])
  debugMercadoPagoAccount() {
    return this.client.send('debugMercadoPagoAccount', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post(':hiringId/delivery')
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FilesInterceptor('attachments', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB por archivo
      },
      fileFilter: (req, file, cb) => {
        // ⚠️ CRÍTICO: Validar los mismos tipos MIME que acepta el frontend
        const allowedMimes = [
          // Imágenes
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          // Videos
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'video/x-msvideo', // .avi
          // Documentos
          'application/pdf',
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.ms-excel', // .xls
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          // Comprimidos
          'application/zip',
          'application/x-rar-compressed',
          'application/x-tar',
          'application/gzip',
          'application/x-7z-compressed',
          // Texto
          'text/plain',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Tipo de archivo no permitido: ${file.mimetype}. Formatos aceptados: imágenes, videos, PDF, documentos de Office, archivos comprimidos y texto plano.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async Delivery(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // ⚠️ CRÍTICO: El frontend envía FormData con estos campos:
    // - content: string (descripción/URL)
    // - deliverableId: string (opcional, debe parsearse a number)
    // - attachments: File[] (array de archivos con nombre 'attachments')

    // Transformar y validar manualmente debido a multipart/form-data
    const deliveryDto: CreateDeliveryDto = {
      content: body.content as string,
      deliverableId: body.deliverableId
        ? parseInt(body.deliverableId)
        : undefined,
    };

    // Validaciones básicas
    if (!deliveryDto.content || deliveryDto.content.length < 10) {
      throw new BadRequestException(
        'El contenido debe tener al menos 10 caracteres',
      );
    }

    if (
      deliveryDto.deliverableId &&
      (isNaN(deliveryDto.deliverableId) || deliveryDto.deliverableId <= 0)
    ) {
      throw new BadRequestException('deliverableId debe ser un número válido');
    }

    // Validar tamaño total de archivos (opcional, ya se valida por archivo)
    if (files && files.length > 0) {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 100 * 1024 * 1024; // 100MB total
      if (totalSize > maxTotalSize) {
        throw new BadRequestException(
          `El tamaño total de los archivos (${(totalSize / 1024 / 1024).toFixed(2)}MB) excede el límite de 100MB`,
        );
      }
    }

    // Subir archivos a GCS y obtener URLs
    const uploadedFiles: Array<{
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    }> = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const extension = extname(file.originalname);
        const filename = `deliveries/${hiringId}/${timestamp}-${randomSuffix}${extension}`;

        try {
          const fileUrl = await this.deliveryStorage.upload(
            file.buffer,
            filename,
            file.mimetype,
          );

          uploadedFiles.push({
            fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
          });
        } catch (error) {
          throw new BadRequestException(
            `Error al subir el archivo ${file.originalname}: ${error.message}`,
          );
        }
      }
    }

    return this.client
      .send('createDelivery', {
        hiringId: +hiringId,
        serviceOwnerId: user.id,
        deliveryDto,
        uploadedFiles,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get(':hiringId/deliveries')
  @AuthRoles([ROLES.USER])
  getDeliveriesByHiring(@Param('hiringId') hiringId: number) {
    return this.client
      .send('getDeliveriesByHiring', {
        hiringId: +hiringId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get(':hiringId/deliverables')
  @AuthRoles([ROLES.USER])
  getDeliverablesWithStatus(
    @Param('hiringId') hiringId: number,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('getDeliverablesWithStatus', {
        hiringId: +hiringId,
        userId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post('deliveries/:deliveryId/review')
  @AuthRoles([ROLES.USER])
  reviewDelivery(
    @User() user: AuthenticatedUser,
    @Param('deliveryId') deliveryId: number,
    @Body() reviewDto: ReviewDeliveryDto,
  ) {
    return this.client
      .send('reviewDelivery', {
        deliveryId: +deliveryId,
        clientUserId: user.id,
        reviewDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Put('deliveries/:deliveryId')
  @AuthRoles([ROLES.USER])
  @UseInterceptors(
    FilesInterceptor('attachments', 10, {
      storage: diskStorage({
        destination: './uploads/deliveries',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB por archivo
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'video/x-msvideo',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/zip',
          'application/x-rar-compressed',
          'application/x-tar',
          'application/gzip',
          'application/x-7z-compressed',
          'text/plain',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Tipo de archivo no permitido: ${file.mimetype}`,
            ),
            false,
          );
        }
      },
    }),
  )
  updateDelivery(
    @User() user: AuthenticatedUser,
    @Param('deliveryId') deliveryId: number,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const updateDto = {
      content: body.content as string,
    };

    return this.client
      .send('updateDelivery', {
        deliveryId: +deliveryId,
        serviceOwnerId: user.id,
        updateDto,
        files: files || [],
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
