import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersClientService } from '../../common/services/users-client.service';
import {
  ContractServiceDto,
  ContractServiceResponseDto,
  CreateDeliveryDto,
  CreateQuotationDto,
  CreateQuotationWithDeliverablesDto,
  CreateServiceHiringDto,
  DeliverySubmissionListResponseDto,
  DeliverySubmissionResponseDto,
  GetServiceHiringsDto,
  PaymentModalityResponseDto,
  ReviewDeliveryDto,
  UpdateDeliveryDto,
} from '../dto';
import { NegotiateServiceHiringDto } from '../dto/negotiate-service-hiring.dto';
import { DeliveryStatus } from '../entities/delivery-submission.entity';
import { ServiceHiringRepository } from '../repositories/service-hiring.repository';
import { MercadoPagoService } from './mercado-pago.service';
import { PaymentModalityService } from './payment-modality.service';
import { AcceptServiceHiringUseCase } from './use-cases/accept-service-hiring.use-case';
import { CancelServiceHiringUseCase } from './use-cases/cancel-service-hiring.use-case';
import { ContractServiceUseCase } from './use-cases/contract-service.use-case';
import { CreateDeliveryUseCase } from './use-cases/create-delivery.use-case';
import { CreateQuotationWithDeliverablesUseCase } from './use-cases/create-quotation-with-deliverables.use-case';
import { CreateQuotationUseCase } from './use-cases/create-quotation.use-case';
import { CreateServiceHiringUseCase } from './use-cases/create-service-hiring.use-case';
import { EditQuotationWithDeliverablesUseCase } from './use-cases/edit-quotation-with-deliverables.use-case';
import { EditQuotationUseCase } from './use-cases/edit-quotation.use-case';
import { GetDeliverablesWithStatusUseCase } from './use-cases/get-deliverables-with-status.use-case';
import { GetServiceHiringsByServiceOwnerUseCase } from './use-cases/get-service-hirings-by-service-owner.use-case';
import { GetServiceHiringsByUserUseCase } from './use-cases/get-service-hirings-by-user.use-case';
import { GetServiceHiringsUseCase } from './use-cases/get-service-hirings.use-case';
import { NegotiateServiceHiringUseCase } from './use-cases/negotiate-service-hiring.use-case';
import { ProcessPaymentWebhookUseCase } from './use-cases/process-payment-webhook.use-case';
import { RejectServiceHiringUseCase } from './use-cases/reject-service-hiring.use-case';
import { RequestRequoteUseCase } from './use-cases/request-requote.use-case';
import { RetryPaymentUseCase } from './use-cases/retry-payment.use-case';
import { ReviewDeliveryUseCase } from './use-cases/review-delivery.use-case';
import { UpdateDeliveryUseCase } from './use-cases/update-delivery.use-case';
import { ServiceHiringStatusCode } from '../enums/service-hiring-status.enum';

@Injectable()
export class ServiceHiringsService {
  constructor(
    private readonly serviceHiringRepository: ServiceHiringRepository,
    private readonly createServiceHiringUseCase: CreateServiceHiringUseCase,
    private readonly createQuotationUseCase: CreateQuotationUseCase,
    private readonly createQuotationWithDeliverablesUseCase: CreateQuotationWithDeliverablesUseCase,
    private readonly editQuotationUseCase: EditQuotationUseCase,
    private readonly editQuotationWithDeliverablesUseCase: EditQuotationWithDeliverablesUseCase,
    private readonly getServiceHiringsUseCase: GetServiceHiringsUseCase,
    private readonly getServiceHiringsByUserUseCase: GetServiceHiringsByUserUseCase,
    private readonly getServiceHiringsByServiceOwnerUseCase: GetServiceHiringsByServiceOwnerUseCase,
    private readonly acceptServiceHiringUseCase: AcceptServiceHiringUseCase,
    private readonly rejectServiceHiringUseCase: RejectServiceHiringUseCase,
    private readonly cancelServiceHiringUseCase: CancelServiceHiringUseCase,
    private readonly negotiateServiceHiringUseCase: NegotiateServiceHiringUseCase,
    private readonly requestRequoteUseCase: RequestRequoteUseCase,
    private readonly contractServiceUseCase: ContractServiceUseCase,
    private readonly processPaymentWebhookUseCase: ProcessPaymentWebhookUseCase,
    private readonly retryPaymentUseCase: RetryPaymentUseCase,
    private readonly createDeliveryUseCase: CreateDeliveryUseCase,
    private readonly reviewDeliveryUseCase: ReviewDeliveryUseCase,
    private readonly updateDeliveryUseCase: UpdateDeliveryUseCase,
    private readonly getDeliverablesWithStatusUseCase: GetDeliverablesWithStatusUseCase,
    private readonly paymentModalityService: PaymentModalityService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly usersClientService: UsersClientService,
  ) {}

  async createServiceHiring(userId: number, createDto: CreateServiceHiringDto) {
    return this.createServiceHiringUseCase.execute(userId, createDto);
  }

  async createQuotation(
    serviceOwnerId: number,
    hiringId: number,
    quotationDto: CreateQuotationDto,
  ) {
    return this.createQuotationUseCase.execute(
      serviceOwnerId,
      hiringId,
      quotationDto,
    );
  }

  async editQuotation(
    serviceOwnerId: number,
    hiringId: number,
    quotationDto: CreateQuotationDto,
  ) {
    return this.editQuotationUseCase.execute(
      serviceOwnerId,
      hiringId,
      quotationDto,
    );
  }

  async createQuotationWithDeliverables(
    serviceOwnerId: number,
    hiringId: number,
    quotationDto: CreateQuotationWithDeliverablesDto,
  ) {
    return this.createQuotationWithDeliverablesUseCase.execute(
      serviceOwnerId,
      hiringId,
      quotationDto,
    );
  }

  async editQuotationWithDeliverables(
    serviceOwnerId: number,
    hiringId: number,
    quotationDto: CreateQuotationWithDeliverablesDto,
  ) {
    return this.editQuotationWithDeliverablesUseCase.execute(
      serviceOwnerId,
      hiringId,
      quotationDto,
    );
  }

  async getPaymentModalities(): Promise<PaymentModalityResponseDto[]> {
    return this.paymentModalityService.getAllPaymentModalities();
  }

  async getServiceHirings(params: GetServiceHiringsDto) {
    return this.getServiceHiringsUseCase.execute(params);
  }

  async getServiceHiringById(userId: number, hiringId: number) {
    const hiring = await this.serviceHiringRepository.findById(hiringId, [
      'service',
      'status',
      'paymentModality',
      'deliverables',
      'claims', // Incluir claims (se cargará automáticamente si está en 'in_claim')
    ]);

    if (!hiring) {
      throw new NotFoundException('Contratación de servicio no encontrada');
    }

    // Verificar que el usuario tenga permiso (es el cliente o el prestador)
    if (hiring.userId !== userId && hiring.service.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para ver esta contratación',
      );
    }

    // Obtener información del owner del servicio
    if (hiring.service && hiring.service.userId) {
      const userWithProfile =
        await this.usersClientService.getUserByIdWithRelations(
          hiring.service.userId,
        );
      if (userWithProfile) {
        (hiring.service as any).owner = {
          id: userWithProfile.id,
          firstName: userWithProfile.profile?.name || '',
          lastName: userWithProfile.profile?.lastName || '',
          email: userWithProfile.email,
          profilePicture: userWithProfile.profile?.profilePicture || null,
        };
      }
    }

    // Obtener información del cliente (usuario que contrató)
    if (hiring.userId) {
      const clientWithProfile =
        await this.usersClientService.getUserByIdWithRelations(hiring.userId);
      if (clientWithProfile) {
        (hiring as any).client = {
          id: clientWithProfile.id,
          firstName: clientWithProfile.profile?.name || '',
          lastName: clientWithProfile.profile?.lastName || '',
          email: clientWithProfile.email,
          profilePicture: clientWithProfile.profile?.profilePicture || null,
        };
      }
    }

    return hiring;
  }

  async getServiceHiringsByUser(userId: number, params: GetServiceHiringsDto) {
    return this.getServiceHiringsByUserUseCase.execute(userId, params);
  }

  async getServiceHiringsByServiceOwner(
    serviceOwnerId: number,
    params: GetServiceHiringsDto,
  ) {
    return this.getServiceHiringsByServiceOwnerUseCase.execute(
      serviceOwnerId,
      params,
    );
  }

  async acceptServiceHiring(userId: number, hiringId: number) {
    return this.acceptServiceHiringUseCase.execute(userId, hiringId);
  }

  async rejectServiceHiring(userId: number, hiringId: number) {
    return this.rejectServiceHiringUseCase.execute(userId, hiringId);
  }

  async cancelServiceHiring(userId: number, hiringId: number) {
    return this.cancelServiceHiringUseCase.execute(userId, hiringId);
  }

  async negotiateServiceHiring(
    userId: number,
    hiringId: number,
    negotiateDto?: NegotiateServiceHiringDto,
  ) {
    return this.negotiateServiceHiringUseCase.execute(
      userId,
      hiringId,
      negotiateDto,
    );
  }

  async requestRequote(hiringId: number, userId: number) {
    return this.requestRequoteUseCase.execute(hiringId, userId);
  }

  async contractService(
    userId: number,
    hiringId: number,
    contractDto: ContractServiceDto,
  ): Promise<ContractServiceResponseDto> {
    return this.contractServiceUseCase.execute(userId, hiringId, contractDto);
  }

  async retryPayment(
    hiringId: number,
  ): Promise<{ initPoint: string; preferenceId: string }> {
    return this.retryPaymentUseCase.execute(hiringId);
  }

  async processPaymentWebhook(paymentId: string): Promise<void> {
    return this.processPaymentWebhookUseCase.execute(paymentId);
  }

  processPreferenceWebhook(preferenceId: string): void {
    console.log('📋 Processing preference webhook:', { preferenceId });
    console.log(
      'ℹ️ With test vendor credentials, preference webhooks should work correctly',
    );

    try {
      // Con las nuevas credenciales de vendedor de prueba, los webhooks de preferencia
      // deberían funcionar correctamente. Por ahora, solo logueamos la información.
      console.log('✅ Preference webhook received for ID:', preferenceId);

      // TODO: Implementar lógica específica de preferencias si es necesario
      // Por ahora, los webhooks de pago son más importantes

      console.log('✅ Preference webhook processing completed:', {
        preferenceId,
        message:
          'Using test vendor credentials should resolve phantom payment issues',
      });
    } catch (error) {
      console.error('❌ Error processing preference webhook:', {
        preferenceId,
        error: error.message,
      });
      // No lanzar error para evitar reintentos innecesarios
    }
  }

  async updatePaymentStatus(
    userId: number,
    hiringId: number,
    paymentStatusDto: {
      payment_id: string;
      status: string;
      external_reference: string;
      merchant_order_id?: string;
      preference_id?: string;
    },
  ): Promise<any> {
    console.log('💰 Processing payment status update:', {
      userId,
      hiringId,
      paymentStatusDto,
    });

    // Verificar que el payment_id corresponda a un pago real
    const paymentDetails = await this.mercadoPagoService.getPayment(
      paymentStatusDto.payment_id,
    );

    if (!paymentDetails) {
      throw new Error('Payment not found in MercadoPago');
    }

    // Procesar el pago usando el webhook handler existente
    await this.processPaymentWebhookUseCase.execute(
      paymentStatusDto.payment_id,
    );

    return {
      success: true,
      message: 'Payment status updated successfully',
      payment: paymentDetails,
    };
  }

  async createDelivery(
    hiringId: number,
    serviceOwnerId: number,
    deliveryDto: CreateDeliveryDto,
    uploadedFiles?: Array<{
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    }>,
  ): Promise<DeliverySubmissionResponseDto> {
    return this.createDeliveryUseCase.execute(
      hiringId,
      serviceOwnerId,
      deliveryDto,
      uploadedFiles,
    );
  }

  async getDeliveriesByHiring(
    hiringId: number,
  ): Promise<DeliverySubmissionListResponseDto> {
    // Obtener el hiring para verificar su estado
    const hiring = await this.serviceHiringRepository.findById(hiringId, [
      'status',
    ]);

    if (!hiring) {
      throw new NotFoundException(
        `Service hiring with ID ${hiringId} not found`,
      );
    }

    // Obtener todas las entregas (sin filtrar por estado del hiring)
    const deliveries =
      await this.createDeliveryUseCase['deliveryRepository'].findByHiringId(
        hiringId,
      );

    // Si el hiring está completado, quitar watermark de todas las entregas (ya pagó el 100%)
    const hiringIsCompleted =
      hiring.status.code === ServiceHiringStatusCode.COMPLETED;

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    return {
      deliveries: deliveries.map((d) => {
        // Mapear attachments con URLs completas
        const attachments =
          d.attachments?.map((att) => ({
            id: att.id,
            filePath: att.filePath,
            fileUrl: att.fileUrl || `${baseUrl}${att.filePath}`, // URL completa
            fileName: att.fileName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            orderIndex: att.orderIndex,
          })) || [];

        return {
          id: d.id,
          hiringId: d.hiringId,
          deliverableId: d.deliverableId,
          deliveryType: d.deliveryType,
          content: d.content,
          attachmentPath: d.attachmentPath, // DEPRECATED: usar attachments[]
          attachmentUrl: d.attachmentPath
            ? `${baseUrl}${d.attachmentPath}`
            : undefined, // DEPRECATED: URL completa
          attachmentSize: d.attachmentSize, // DEPRECATED: usar attachments[]
          attachments, // ✅ Array de archivos con URLs completas
          price: Number(d.price),
          status: d.status,
          // Si el hiring está completado, no mostrar watermark (ya pagó)
          // Si no está completado, mostrar watermark si la entrega no está aprobada
          needsWatermark: hiringIsCompleted
            ? false
            : d.status !== DeliveryStatus.APPROVED,
          deliveredAt: d.deliveredAt,
          reviewedAt: d.reviewedAt,
          approvedAt: d.approvedAt,
          revisionNotes: d.revisionNotes,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        };
      }),
      total: deliveries.length,
    };
  }

  async reviewDelivery(
    deliveryId: number,
    clientUserId: number,
    reviewDto: ReviewDeliveryDto,
  ) {
    return this.reviewDeliveryUseCase.execute(
      deliveryId,
      clientUserId,
      reviewDto,
    );
  }

  async updateDelivery(
    deliveryId: number,
    serviceOwnerId: number,
    updateDto: UpdateDeliveryDto,
    attachmentSize?: number,
  ): Promise<DeliverySubmissionResponseDto> {
    return this.updateDeliveryUseCase.execute(
      deliveryId,
      serviceOwnerId,
      updateDto,
      attachmentSize,
    );
  }

  async checkUserActiveHirings(userId: number): Promise<{
    hasActiveHirings: boolean;
    count: number;
  }> {
    const activeStatuses = [
      'accepted',
      'approved',
      'in_progress',
      'delivered',
      'revision_requested',
      'in_claim',
    ];

    const activeHiringsCount =
      await this.serviceHiringRepository.countActiveHiringsByUserId(
        userId,
        activeStatuses,
      );

    return {
      hasActiveHirings: activeHiringsCount > 0,
      count: activeHiringsCount,
    };
  }

  async getDeliverablesWithStatus(hiringId: number, userId: number) {
    return this.getDeliverablesWithStatusUseCase.execute(hiringId, userId);
  }
}
