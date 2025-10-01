import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ContractServiceDto,
  CreateQuotationDto,
  CreateServiceHiringDto,
  GetServiceHiringsDto,
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

  @MessagePattern('getServiceHirings')
  async getServiceHirings(@Payload() params: GetServiceHiringsDto) {
    return this.serviceHiringsService.getServiceHirings(params);
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
    @Payload() data: { userId: number; hiringId: number },
  ) {
    return this.serviceHiringsService.negotiateServiceHiring(
      data.userId,
      data.hiringId,
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

  @MessagePattern('processPaymentWebhook')
  async processPaymentWebhook(@Payload() data: { paymentId: string }) {
    return this.serviceHiringsService.processPaymentWebhook(data.paymentId);
  }
}
