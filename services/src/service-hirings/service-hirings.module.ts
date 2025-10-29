import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { ServicesModule } from '../services/services.module';
import { ClaimsController } from './controllers/claims.controller';
import { ServiceHiringsController } from './controllers/service-hirings.controller';
import { Claim } from './entities/claim.entity';
import { Deliverable } from './entities/deliverable.entity';
import { DeliverySubmission } from './entities/delivery-submission.entity';
import { PaymentModality } from './entities/payment-modality.entity';
import { Payment } from './entities/payment.entity';
import { ServiceHiringStatus } from './entities/service-hiring-status.entity';
import { ServiceHiring } from './entities/service-hiring.entity';
import { ClaimRepository } from './repositories/claim.repository';
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
import { AddObservationsUseCase } from './services/use-cases/add-observations.use-case';
import { CancelServiceHiringUseCase } from './services/use-cases/cancel-service-hiring.use-case';
import { ContractServiceUseCase } from './services/use-cases/contract-service.use-case';
import { CreateClaimUseCase } from './services/use-cases/create-claim.use-case';
import { CreateDeliveryUseCase } from './services/use-cases/create-delivery.use-case';
import { CreateQuotationWithDeliverablesUseCase } from './services/use-cases/create-quotation-with-deliverables.use-case';
import { CreateQuotationUseCase } from './services/use-cases/create-quotation.use-case';
import { CreateServiceHiringUseCase } from './services/use-cases/create-service-hiring.use-case';
import { EditQuotationWithDeliverablesUseCase } from './services/use-cases/edit-quotation-with-deliverables.use-case';
import { EditQuotationUseCase } from './services/use-cases/edit-quotation.use-case';
import { GetClaimsUseCase } from './services/use-cases/get-claims.use-case';
import { GetDeliverablesWithStatusUseCase } from './services/use-cases/get-deliverables-with-status.use-case';
import { GetServiceHiringsByServiceOwnerUseCase } from './services/use-cases/get-service-hirings-by-service-owner.use-case';
import { GetServiceHiringsByUserUseCase } from './services/use-cases/get-service-hirings-by-user.use-case';
import { GetServiceHiringsUseCase } from './services/use-cases/get-service-hirings.use-case';
import { NegotiateServiceHiringUseCase } from './services/use-cases/negotiate-service-hiring.use-case';
import { ProcessPaymentWebhookUseCase } from './services/use-cases/process-payment-webhook.use-case';
import { RejectServiceHiringUseCase } from './services/use-cases/reject-service-hiring.use-case';
import { RequestRequoteUseCase } from './services/use-cases/request-requote.use-case';
import { ResolveClaimUseCase } from './services/use-cases/resolve-claim.use-case';
import { ReviewDeliveryUseCase } from './services/use-cases/review-delivery.use-case';
import { UpdateClaimUseCase } from './services/use-cases/update-claim.use-case';
import { UpdateDeliveryUseCase } from './services/use-cases/update-delivery.use-case';
import { ServiceHiringStateFactory } from './states/service-hiring-state.factory';

@Module({
  controllers: [ServiceHiringsController, ClaimsController],
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
    RequestRequoteUseCase,
    ContractServiceUseCase,
    ProcessPaymentWebhookUseCase,
    CreateDeliveryUseCase,
    ReviewDeliveryUseCase,
    UpdateDeliveryUseCase,
    GetDeliverablesWithStatusUseCase,
    CreateClaimUseCase,
    GetClaimsUseCase,
    ResolveClaimUseCase,
    AddObservationsUseCase,
    UpdateClaimUseCase,
    ServiceHiringRepository,
    ClaimRepository,
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
      Claim,
    ]),
    CommonModule,
    forwardRef(() => ServicesModule),
  ],
  exports: [
    ServiceHiringsService,
    ServiceHiringRepository,
    DeliverableRepository,
  ],
})
export class ServiceHiringsModule {}
