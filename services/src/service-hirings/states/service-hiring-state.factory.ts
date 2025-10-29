import { Injectable } from '@nestjs/common';
import { ServiceHiring } from '../entities/service-hiring.entity';
import { ServiceHiringStatusCode } from '../enums/service-hiring-status.enum';
import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';
import { AcceptedServiceHiringState } from './accepted-service-hiring.state';
import { ApprovedServiceHiringState } from './approved-service-hiring.state';
import { CancelledByClaimServiceHiringState } from './cancelled-by-claim-service-hiring.state';
import { CancelledServiceHiringState } from './cancelled-service-hiring.state';
import { CompletedByClaimServiceHiringState } from './completed-by-claim-service-hiring.state';
import { CompletedServiceHiringState } from './completed-service-hiring.state';
import { CompletedWithAgreementServiceHiringState } from './completed-with-agreement-service-hiring.state';
import { DeliveredServiceHiringState } from './delivered-service-hiring.state';
import { ExpiredServiceHiringState } from './expired-service-hiring.state';
import { InClaimServiceHiringState } from './in-claim-service-hiring.state';
import { InProgressServiceHiringState } from './in-progress-service-hiring.state';
import { NegotiatingServiceHiringState } from './negotiating-service-hiring.state';
import { PendingServiceHiringState } from './pending-service-hiring.state';
import { QuotedServiceHiringState } from './quoted-service-hiring.state';
import { RejectedServiceHiringState } from './rejected-service-hiring.state';
import { RequotingServiceHiringState } from './requoting-service-hiring.state';
import { RevisionRequestedServiceHiringState } from './revision-requested-service-hiring.state';

@Injectable()
export class ServiceHiringStateFactory {
  createState(hiring: ServiceHiring): ServiceHiringStateInterface {
    if (!hiring.status) {
      throw new Error('Service hiring status is required');
    }

    switch (hiring.status.code) {
      case ServiceHiringStatusCode.PENDING:
        return new PendingServiceHiringState();
      case ServiceHiringStatusCode.QUOTED:
        return new QuotedServiceHiringState();
      case ServiceHiringStatusCode.ACCEPTED:
        return new AcceptedServiceHiringState();
      case ServiceHiringStatusCode.REJECTED:
        return new RejectedServiceHiringState();
      case ServiceHiringStatusCode.CANCELLED:
        return new CancelledServiceHiringState();
      case ServiceHiringStatusCode.APPROVED:
        return new ApprovedServiceHiringState();
      case ServiceHiringStatusCode.IN_PROGRESS:
        return new InProgressServiceHiringState();
      case ServiceHiringStatusCode.DELIVERED:
        return new DeliveredServiceHiringState();
      case ServiceHiringStatusCode.REVISION_REQUESTED:
        return new RevisionRequestedServiceHiringState();
      case ServiceHiringStatusCode.COMPLETED:
        return new CompletedServiceHiringState();
      case ServiceHiringStatusCode.NEGOTIATING:
        return new NegotiatingServiceHiringState();
      case ServiceHiringStatusCode.REQUOTING:
        return new RequotingServiceHiringState();
      case ServiceHiringStatusCode.EXPIRED:
        return new ExpiredServiceHiringState();
      case ServiceHiringStatusCode.IN_CLAIM:
        return new InClaimServiceHiringState();
      case ServiceHiringStatusCode.CANCELLED_BY_CLAIM:
        return new CancelledByClaimServiceHiringState();
      case ServiceHiringStatusCode.COMPLETED_BY_CLAIM:
        return new CompletedByClaimServiceHiringState();
      case ServiceHiringStatusCode.COMPLETED_WITH_AGREEMENT:
        return new CompletedWithAgreementServiceHiringState();
      default:
        throw new Error(`Unknown service hiring status: ${hiring.status.code}`);
    }
  }
}
