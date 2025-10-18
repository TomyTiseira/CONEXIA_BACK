import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { ServicesModule } from '../services/services.module';
import { ServiceHiringsController } from './controllers/service-hirings.controller';
import { Deliverable } from './entities/deliverable.entity';
import { DeliverySubmission } from './entities/delivery-submission.entity';
import { PaymentModality } from './entities/payment-modality.entity';
import { Payment } from './entities/payment.entity';
import { ServiceHiringStatus } from './entities/service-hiring-status.entity';
import { ServiceHiring } from './entities/service-hiring.entity';
import { DeliverableRepository } from './repositories/deliverable.repository';
import { DeliverySubmissionRepository } from './repositories/delivery-submission.repository';
import { PaymentModalityRepository } from './repositories/payment-modality.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { ServiceHiringStatusRepository } from './repositories/service-hiring-status.repository';
import { ServiceHiringRepository } from './repositories/service-hiring.repository';
import { MercadoPagoService } from './services/mercado-pago.service';
import { PaymentModalityService } from './services/payment-modality.service';
import { QuotationExpirationService } from './services/quotation-expiration.service';
import { ServiceHiringOperationsService } from './services/service-hiring-operations.service';
import { ServiceHiringStatusService } from './services/service-hiring-status.service';
import { ServiceHiringTransformService } from './services/service-hiring-transform.service';
import { ServiceHiringValidationService } from './services/service-hiring-validation.service';
import { ServiceHiringsService } from './services/service-hirings.service';
import { AcceptServiceHiringUseCase } from './services/use-cases/accept-service-hiring.use-case';
import { CancelServiceHiringUseCase } from './services/use-cases/cancel-service-hiring.use-case';
import { ContractServiceUseCase } from './services/use-cases/contract-service.use-case';
import { CreateDeliveryUseCase } from './services/use-cases/create-delivery.use-case';
import { CreateQuotationWithDeliverablesUseCase } from './services/use-cases/create-quotation-with-deliverables.use-case';
import { CreateQuotationUseCase } from './services/use-cases/create-quotation.use-case';
import { CreateServiceHiringUseCase } from './services/use-cases/create-service-hiring.use-case';
import { EditQuotationWithDeliverablesUseCase } from './services/use-cases/edit-quotation-with-deliverables.use-case';
import { EditQuotationUseCase } from './services/use-cases/edit-quotation.use-case';
import { GetServiceHiringsByServiceOwnerUseCase } from './services/use-cases/get-service-hirings-by-service-owner.use-case';
import { GetServiceHiringsByUserUseCase } from './services/use-cases/get-service-hirings-by-user.use-case';
import { GetServiceHiringsUseCase } from './services/use-cases/get-service-hirings.use-case';
import { NegotiateServiceHiringUseCase } from './services/use-cases/negotiate-service-hiring.use-case';
import { ProcessPaymentWebhookUseCase } from './services/use-cases/process-payment-webhook.use-case';
import { RejectServiceHiringUseCase } from './services/use-cases/reject-service-hiring.use-case';
import { ReviewDeliveryUseCase } from './services/use-cases/review-delivery.use-case';
import { UpdateDeliveryUseCase } from './services/use-cases/update-delivery.use-case';
import { ServiceHiringStateFactory } from './states/service-hiring-state.factory';

@Module({
  controllers: [ServiceHiringsController],
  providers: [
    ServiceHiringsService,
    CreateServiceHiringUseCase,
    CreateQuotationUseCase,
    CreateQuotationWithDeliverablesUseCase,
    EditQuotationUseCase,
    EditQuotationWithDeliverablesUseCase,
    GetServiceHiringsUseCase,
    GetServiceHiringsByUserUseCase,
    GetServiceHiringsByServiceOwnerUseCase,
    AcceptServiceHiringUseCase,
    RejectServiceHiringUseCase,
    CancelServiceHiringUseCase,
    NegotiateServiceHiringUseCase,
    ContractServiceUseCase,
    ProcessPaymentWebhookUseCase,
    CreateDeliveryUseCase,
    ReviewDeliveryUseCase,
    UpdateDeliveryUseCase,
    ServiceHiringRepository,
    ServiceHiringStatusRepository,
    PaymentRepository,
    PaymentModalityRepository,
    DeliverableRepository,
    DeliverySubmissionRepository,
    ServiceHiringStatusService,
    ServiceHiringValidationService,
    ServiceHiringOperationsService,
    ServiceHiringTransformService,
    ServiceHiringStateFactory,
    QuotationExpirationService,
    PaymentModalityService,
    MercadoPagoService,
  ],
  imports: [
    TypeOrmModule.forFeature([
      ServiceHiring,
      ServiceHiringStatus,
      Payment,
      PaymentModality,
      Deliverable,
      DeliverySubmission,
    ]),
    CommonModule,
    forwardRef(() => ServicesModule),
  ],
  exports: [ServiceHiringsService, ServiceHiringRepository],
})
export class ServiceHiringsModule {}
