import { Injectable } from '@nestjs/common';
import { ServiceHiring } from '../entities/service-hiring.entity';
import { ServiceHiringContext } from '../states/service-hiring-context';
import { ServiceHiringStateFactory } from '../states/service-hiring-state.factory';

@Injectable()
export class ServiceHiringOperationsService {
  constructor(private readonly stateFactory: ServiceHiringStateFactory) {}

  getHiringContext(hiring: ServiceHiring): ServiceHiringContext {
    const state = this.stateFactory.createState(hiring);
    return new ServiceHiringContext(hiring, state);
  }

  canPerformAction(hiring: ServiceHiring, action: string): boolean {
    const context = this.getHiringContext(hiring);

    switch (action) {
      case 'quote':
        return context.canQuote();
      case 'accept':
        return context.canAccept();
      case 'reject':
        return context.canReject();
      case 'cancel':
        return context.canCancel();
      case 'negotiate':
        return context.canNegotiate();
      case 'edit':
        return context.canEdit();
      default:
        return false;
    }
  }

  getAvailableActions(hiring: ServiceHiring): string[] {
    const context = this.getHiringContext(hiring);
    return context.getAvailableActions();
  }
}
