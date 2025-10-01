import { Injectable } from '@nestjs/common';
import { ServiceHiring } from '../entities/service-hiring.entity';
import { ServiceHiringStatusCode } from '../enums/service-hiring-status.enum';
import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';
import { AcceptedServiceHiringState } from './accepted-service-hiring.state';
import { ApprovedServiceHiringState } from './approved-service-hiring.state';
import { CancelledServiceHiringState } from './cancelled-service-hiring.state';
import { NegotiatingServiceHiringState } from './negotiating-service-hiring.state';
import { PendingServiceHiringState } from './pending-service-hiring.state';
import { QuotedServiceHiringState } from './quoted-service-hiring.state';
import { RejectedServiceHiringState } from './rejected-service-hiring.state';

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
      case ServiceHiringStatusCode.NEGOTIATING:
        return new NegotiatingServiceHiringState();
      default:
        throw new Error(`Unknown service hiring status: ${hiring.status.code}`);
    }
  }
}
