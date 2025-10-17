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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { catchError } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config/service';
import {
  ContractServiceDto,
  CreateDeliveryDto,
  CreateQuotationDto,
  CreateQuotationWithDeliverablesDto,
  CreateServiceHiringDto,
  GetServiceHiringsDto,
  ReviewDeliveryDto,
  UpdatePaymentStatusDto,
} from './dto';

@Controller('service-hirings')
export class ServiceHiringsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  @AuthRoles([ROLES.USER])
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
  ) {
    return this.client
      .send('negotiateServiceHiring', {
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
    FileInterceptor('attachment', {
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
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  )
  createDelivery(
    @User() user: AuthenticatedUser,
    @Param('hiringId') hiringId: number,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Transformar y validar manualmente debido a multipart/form-data
    const deliveryDto: CreateDeliveryDto = {
      content: body.content as string,
      deliverableId: body.deliverableId
        ? Number(body.deliverableId)
        : undefined,
    };

    // Validaciones básicas
    if (!deliveryDto.content || deliveryDto.content.length < 10) {
      throw new BadRequestException(
        'El contenido debe tener al menos 10 caracteres',
      );
    }

    if (deliveryDto.deliverableId && isNaN(deliveryDto.deliverableId)) {
      throw new BadRequestException('deliverableId debe ser un número válido');
    }

    return this.client
      .send('createDelivery', {
        hiringId: +hiringId,
        serviceOwnerId: user.id,
        deliveryDto,
        attachmentPath: file ? `/uploads/deliveries/${file.filename}` : null,
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
}
