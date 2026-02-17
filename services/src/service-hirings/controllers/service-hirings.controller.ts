import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ContractServiceDto,
  CreateDeliveryDto,
  CreateQuotationDto,
  CreateQuotationWithDeliverablesDto,
  CreateServiceHiringDto,
  GetServiceHiringsDto,
  ReviewDeliveryDto,
} from '../dto';
import { ServiceHiringsService } from '../services/service-hirings.service';

@Controller('service-hirings')
export class ServiceHiringsController {
  constructor(private readonly serviceHiringsService: ServiceHiringsService) {}

  @MessagePattern('createServiceHiring')
  async createServiceHiring(
    @Payload() data: { userId: number; createDto: CreateServiceHiringDto },
  ) {
    return this.serviceHiringsService.createServiceHiring(
      data.userId,
      data.createDto,
    );
  }

  @MessagePattern('createQuotation')
  async createQuotation(
    @Payload()
    data: {
      serviceOwnerId: number;
      hiringId: number;
      quotationDto: CreateQuotationDto;
    },
  ) {
    return this.serviceHiringsService.createQuotation(
      data.serviceOwnerId,
      data.hiringId,
      data.quotationDto,
    );
  }

  @MessagePattern('editQuotation')
  async editQuotation(
    @Payload()
    data: {
      serviceOwnerId: number;
      hiringId: number;
      quotationDto: CreateQuotationDto;
    },
  ) {
    return this.serviceHiringsService.editQuotation(
      data.serviceOwnerId,
      data.hiringId,
      data.quotationDto,
    );
  }

  @MessagePattern('createQuotationWithDeliverables')
  async createQuotationWithDeliverables(
    @Payload()
    data: {
      serviceOwnerId: number;
      hiringId: number;
      quotationDto: CreateQuotationWithDeliverablesDto;
    },
  ) {
    return this.serviceHiringsService.createQuotationWithDeliverables(
      data.serviceOwnerId,
      data.hiringId,
      data.quotationDto,
    );
  }

  @MessagePattern('editQuotationWithDeliverables')
  async editQuotationWithDeliverables(
    @Payload()
    data: {
      serviceOwnerId: number;
      hiringId: number;
      quotationDto: CreateQuotationWithDeliverablesDto;
    },
  ) {
    return this.serviceHiringsService.editQuotationWithDeliverables(
      data.serviceOwnerId,
      data.hiringId,
      data.quotationDto,
    );
  }

  @MessagePattern('getPaymentModalities')
  async getPaymentModalities() {
    return this.serviceHiringsService.getPaymentModalities();
  }

  @MessagePattern('getServiceHirings')
  async getServiceHirings(@Payload() params: GetServiceHiringsDto) {
    return this.serviceHiringsService.getServiceHirings(params);
  }

  @MessagePattern('getServiceHiringById')
  async getServiceHiringById(
    @Payload() data: { userId: number; hiringId: number },
  ) {
    return this.serviceHiringsService.getServiceHiringById(
      data.userId,
      data.hiringId,
    );
  }

  @MessagePattern('getServiceHiringsByUser')
  async getServiceHiringsByUser(
    @Payload() data: { userId: number; params: GetServiceHiringsDto },
  ) {
    return this.serviceHiringsService.getServiceHiringsByUser(
      data.userId,
      data.params,
    );
  }

  @MessagePattern('getServiceHiringsByServiceOwner')
  async getServiceHiringsByServiceOwner(
    @Payload() data: { serviceOwnerId: number; params: GetServiceHiringsDto },
  ) {
    return this.serviceHiringsService.getServiceHiringsByServiceOwner(
      data.serviceOwnerId,
      data.params,
    );
  }

  @MessagePattern('acceptServiceHiring')
  async acceptServiceHiring(
    @Payload() data: { userId: number; hiringId: number },
  ) {
    return this.serviceHiringsService.acceptServiceHiring(
      data.userId,
      data.hiringId,
    );
  }

  @MessagePattern('rejectServiceHiring')
  async rejectServiceHiring(
    @Payload() data: { userId: number; hiringId: number },
  ) {
    return this.serviceHiringsService.rejectServiceHiring(
      data.userId,
      data.hiringId,
    );
  }

  @MessagePattern('cancelServiceHiring')
  async cancelServiceHiring(
    @Payload() data: { userId: number; hiringId: number },
  ) {
    return this.serviceHiringsService.cancelServiceHiring(
      data.userId,
      data.hiringId,
    );
  }

  @MessagePattern('negotiateServiceHiring')
  async negotiateServiceHiring(
    @Payload()
    data: {
      userId: number;
      hiringId: number;
      negotiateDto?: any;
    },
  ) {
    return this.serviceHiringsService.negotiateServiceHiring(
      data.userId,
      data.hiringId,
      data.negotiateDto,
    );
  }

  @MessagePattern('requestRequote')
  async requestRequote(
    @Payload()
    data: {
      userId: number;
      hiringId: number;
    },
  ) {
    return this.serviceHiringsService.requestRequote(
      data.hiringId,
      data.userId,
    );
  }

  @MessagePattern('contractService')
  async contractService(
    @Payload()
    data: {
      userId: number;
      hiringId: number;
      contractDto: ContractServiceDto;
    },
  ) {
    return this.serviceHiringsService.contractService(
      data.userId,
      data.hiringId,
      data.contractDto,
    );
  }

  @MessagePattern('retryPayment')
  async retryPayment(
    @Payload()
    data: {
      hiringId: number;
    },
  ) {
    return this.serviceHiringsService.retryPayment(data.hiringId);
  }

  @MessagePattern('process_payment_webhook')
  async processPaymentWebhook(
    @Payload()
    data: {
      paymentId: string;
      action: string;
      webhookData: any;
    },
  ) {
    return this.serviceHiringsService.processPaymentWebhook(data.paymentId);
  }

  @MessagePattern('process_preference_webhook')
  processPreferenceWebhook(
    @Payload()
    data: {
      preferenceId: string;
      action: string;
      webhookData: any;
    },
  ) {
    return this.serviceHiringsService.processPreferenceWebhook(
      data.preferenceId,
    );
  }

  @MessagePattern('updatePaymentStatus')
  async updatePaymentStatus(
    @Payload()
    data: {
      userId: number;
      hiringId: number;
      paymentStatusDto: {
        payment_id: string;
        status: string;
        external_reference: string;
        merchant_order_id?: string;
        preference_id?: string;
      };
    },
  ) {
    return this.serviceHiringsService.updatePaymentStatus(
      data.userId,
      data.hiringId,
      data.paymentStatusDto,
    );
  }

  @MessagePattern('createDelivery')
  async createDelivery(
    @Payload()
    data: {
      hiringId: number;
      serviceOwnerId: number;
      deliveryDto: CreateDeliveryDto;
      uploadedFiles?: Array<{
        fileUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
      }>;
    },
  ) {
    return this.serviceHiringsService.createDelivery(
      data.hiringId,
      data.serviceOwnerId,
      data.deliveryDto,
      data.uploadedFiles,
    );
  }

  @MessagePattern('getDeliveriesByHiring')
  async getDeliveriesByHiring(@Payload() data: { hiringId: number }) {
    return this.serviceHiringsService.getDeliveriesByHiring(data.hiringId);
  }

  @MessagePattern('reviewDelivery')
  async reviewDelivery(
    @Payload()
    data: {
      deliveryId: number;
      clientUserId: number;
      reviewDto: ReviewDeliveryDto;
    },
  ) {
    return this.serviceHiringsService.reviewDelivery(
      data.deliveryId,
      data.clientUserId,
      data.reviewDto,
    );
  }

  @MessagePattern('updateDelivery')
  async updateDelivery(
    @Payload()
    data: {
      deliveryId: number;
      serviceOwnerId: number;
      updateDto: any;
      attachmentSize?: number;
    },
  ) {
    return this.serviceHiringsService.updateDelivery(
      data.deliveryId,
      data.serviceOwnerId,
      data.updateDto,
      data.attachmentSize,
    );
  }

  @MessagePattern('checkUserActiveHirings')
  async checkUserActiveHirings(@Payload() data: { userId: number }) {
    return this.serviceHiringsService.checkUserActiveHirings(data.userId);
  }

  @MessagePattern('getDeliverablesWithStatus')
  async getDeliverablesWithStatus(
    @Payload() data: { hiringId: number; userId: number },
  ) {
    return this.serviceHiringsService.getDeliverablesWithStatus(
      data.hiringId,
      data.userId,
    );
  }
}
