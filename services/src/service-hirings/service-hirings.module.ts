import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { ServiceReviewsModule } from '../service-reviews/service-reviews.module';
import { ServicesModule } from '../services/services.module';
import { ClaimsController } from './controllers/claims.controller';
import { ComplianceController } from './controllers/compliance.controller';
import { ServiceHiringsController } from './controllers/service-hirings.controller';
import { ClaimCompliance } from './entities/claim-compliance.entity';
import { Claim } from './entities/claim.entity';
import { ComplianceSubmission } from './entities/compliance-submission.entity';
import { Deliverable } from './entities/deliverable.entity';
import { DeliveryAttachment } from './entities/delivery-attachment.entity';
import { DeliverySubmission } from './entities/delivery-submission.entity';
import { PaymentModality } from './entities/payment-modality.entity';
import { Payment } from './entities/payment.entity';
import { ServiceHiringStatus } from './entities/service-hiring-status.entity';
import { ServiceHiring } from './entities/service-hiring.entity';
import { ClaimComplianceRepository } from './repositories/claim-compliance.repository';
import { ClaimRepository } from './repositories/claim.repository';
import { ComplianceSubmissionRepository } from './repositories/compliance-submission.repository';
import { DeliverableRepository } from './repositories/deliverable.repository';
import { DeliveryAttachmentRepository } from './repositories/delivery-attachment.repository';
import { DeliverySubmissionRepository } from './repositories/delivery-submission.repository';
import { PaymentModalityRepository } from './repositories/payment-modality.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { ServiceHiringStatusRepository } from './repositories/service-hiring-status.repository';
import { ServiceHiringRepository } from './repositories/service-hiring.repository';
import { ComplianceConsequenceService } from './services/compliance-consequence.service';
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
import { CancelClaimUseCase } from './services/use-cases/cancel-claim.use-case';
import { CancelServiceHiringUseCase } from './services/use-cases/cancel-service-hiring.use-case';
import { CheckOverdueCompliancesUseCase } from './services/use-cases/compliance/check-overdue-compliances.use-case';
import { CreateComplianceUseCase } from './services/use-cases/compliance/create-compliance.use-case';
import { ModeratorReviewComplianceUseCase } from './services/use-cases/compliance/moderator-review-compliance.use-case';
import { PeerReviewComplianceUseCase } from './services/use-cases/compliance/peer-review-compliance.use-case';
import { SubmitComplianceByClaimUseCase } from './services/use-cases/compliance/submit-compliance-by-claim.use-case';
import { SubmitComplianceUseCase } from './services/use-cases/compliance/submit-compliance.use-case';
import { ContractServiceUseCase } from './services/use-cases/contract-service.use-case';
import { CreateClaimUseCase } from './services/use-cases/create-claim.use-case';
import { CreateDeliveryUseCase } from './services/use-cases/create-delivery.use-case';
import { CreateQuotationWithDeliverablesUseCase } from './services/use-cases/create-quotation-with-deliverables.use-case';
import { CreateQuotationUseCase } from './services/use-cases/create-quotation.use-case';
import { CreateServiceHiringUseCase } from './services/use-cases/create-service-hiring.use-case';
import { EditQuotationWithDeliverablesUseCase } from './services/use-cases/edit-quotation-with-deliverables.use-case';
import { EditQuotationUseCase } from './services/use-cases/edit-quotation.use-case';
import { GetClaimDetailUseCase } from './services/use-cases/get-claim-detail.use-case';
import { GetClaimsUseCase } from './services/use-cases/get-claims.use-case';
import { GetDeliverablesWithStatusUseCase } from './services/use-cases/get-deliverables-with-status.use-case';
import { GetMyClaimsUseCase } from './services/use-cases/get-my-claims.use-case';
import { GetServiceHiringsByServiceOwnerUseCase } from './services/use-cases/get-service-hirings-by-service-owner.use-case';
import { GetServiceHiringsByUserUseCase } from './services/use-cases/get-service-hirings-by-user.use-case';
import { GetServiceHiringsUseCase } from './services/use-cases/get-service-hirings.use-case';
import { NegotiateServiceHiringUseCase } from './services/use-cases/negotiate-service-hiring.use-case';
import { ProcessPaymentWebhookUseCase } from './services/use-cases/process-payment-webhook.use-case';
import { RejectServiceHiringUseCase } from './services/use-cases/reject-service-hiring.use-case';
import { RequestRequoteUseCase } from './services/use-cases/request-requote.use-case';
import { ResolveClaimUseCase } from './services/use-cases/resolve-claim.use-case';
import { RetryPaymentUseCase } from './services/use-cases/retry-payment.use-case';
import { ReviewDeliveryUseCase } from './services/use-cases/review-delivery.use-case';
import { SubmitRespondentObservationsUseCase } from './services/use-cases/submit-respondent-observations.use-case';
import { UpdateClaimUseCase } from './services/use-cases/update-claim.use-case';
import { UpdateDeliveryUseCase } from './services/use-cases/update-delivery.use-case';
import { ServiceHiringStateFactory } from './states/service-hiring-state.factory';

@Module({
  controllers: [
    ServiceHiringsController,
    ClaimsController,
    ComplianceController,
  ],
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
    RetryPaymentUseCase,
    CreateDeliveryUseCase,
    ReviewDeliveryUseCase,
    UpdateDeliveryUseCase,
    GetDeliverablesWithStatusUseCase,
    CreateClaimUseCase,
    CancelClaimUseCase,
    GetClaimsUseCase,
    GetMyClaimsUseCase,
    GetClaimDetailUseCase,
    ResolveClaimUseCase,
    AddObservationsUseCase,
    SubmitRespondentObservationsUseCase,
    UpdateClaimUseCase,
    CreateComplianceUseCase,
    SubmitComplianceUseCase,
    SubmitComplianceByClaimUseCase,
    PeerReviewComplianceUseCase,
    ModeratorReviewComplianceUseCase,
    CheckOverdueCompliancesUseCase,
    ServiceHiringRepository,
    ClaimRepository,
    ClaimComplianceRepository,
    ComplianceSubmissionRepository,
    ServiceHiringStatusRepository,
    PaymentRepository,
    PaymentModalityRepository,
    DeliverableRepository,
    DeliverySubmissionRepository,
    DeliveryAttachmentRepository,
    ServiceHiringStatusService,
    ServiceHiringValidationService,
    ComplianceConsequenceService,
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
      DeliveryAttachment,
      Claim,
      ClaimCompliance,
      ComplianceSubmission,
    ]),
    ScheduleModule.forRoot(),
    CommonModule,
    forwardRef(() => ServicesModule),
    forwardRef(() => ServiceReviewsModule),
  ],
  exports: [
    ServiceHiringsService,
    ServiceHiringRepository,
    DeliverableRepository,
  ],
})
export class ServiceHiringsModule {}
