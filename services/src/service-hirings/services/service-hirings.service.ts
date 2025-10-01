import { Injectable } from '@nestjs/common';
import {
  ContractServiceDto,
  ContractServiceResponseDto,
  CreateQuotationDto,
  CreateServiceHiringDto,
  GetServiceHiringsDto,
} from '../dto';
import { AcceptServiceHiringUseCase } from './use-cases/accept-service-hiring.use-case';
import { CancelServiceHiringUseCase } from './use-cases/cancel-service-hiring.use-case';
import { ContractServiceUseCase } from './use-cases/contract-service.use-case';
import { CreateQuotationUseCase } from './use-cases/create-quotation.use-case';
import { CreateServiceHiringUseCase } from './use-cases/create-service-hiring.use-case';
import { EditQuotationUseCase } from './use-cases/edit-quotation.use-case';
import { GetServiceHiringsByServiceOwnerUseCase } from './use-cases/get-service-hirings-by-service-owner.use-case';
import { GetServiceHiringsByUserUseCase } from './use-cases/get-service-hirings-by-user.use-case';
import { GetServiceHiringsUseCase } from './use-cases/get-service-hirings.use-case';
import { NegotiateServiceHiringUseCase } from './use-cases/negotiate-service-hiring.use-case';
import { ProcessPaymentWebhookUseCase } from './use-cases/process-payment-webhook.use-case';
import { RejectServiceHiringUseCase } from './use-cases/reject-service-hiring.use-case';

@Injectable()
export class ServiceHiringsService {
  constructor(
    private readonly createServiceHiringUseCase: CreateServiceHiringUseCase,
    private readonly createQuotationUseCase: CreateQuotationUseCase,
    private readonly editQuotationUseCase: EditQuotationUseCase,
    private readonly getServiceHiringsUseCase: GetServiceHiringsUseCase,
    private readonly getServiceHiringsByUserUseCase: GetServiceHiringsByUserUseCase,
    private readonly getServiceHiringsByServiceOwnerUseCase: GetServiceHiringsByServiceOwnerUseCase,
    private readonly acceptServiceHiringUseCase: AcceptServiceHiringUseCase,
    private readonly rejectServiceHiringUseCase: RejectServiceHiringUseCase,
    private readonly cancelServiceHiringUseCase: CancelServiceHiringUseCase,
    private readonly negotiateServiceHiringUseCase: NegotiateServiceHiringUseCase,
    private readonly contractServiceUseCase: ContractServiceUseCase,
    private readonly processPaymentWebhookUseCase: ProcessPaymentWebhookUseCase,
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

  async getServiceHirings(params: GetServiceHiringsDto) {
    return this.getServiceHiringsUseCase.execute(params);
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

  async negotiateServiceHiring(userId: number, hiringId: number) {
    return this.negotiateServiceHiringUseCase.execute(userId, hiringId);
  }

  async contractService(
    userId: number,
    hiringId: number,
    contractDto: ContractServiceDto,
  ): Promise<ContractServiceResponseDto> {
    return this.contractServiceUseCase.execute(userId, hiringId, contractDto);
  }

  async processPaymentWebhook(paymentId: string): Promise<void> {
    return this.processPaymentWebhookUseCase.execute(paymentId);
  }
}
