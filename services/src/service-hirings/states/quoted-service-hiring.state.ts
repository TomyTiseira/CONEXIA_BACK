import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class QuotedServiceHiringState implements ServiceHiringStateInterface {
  canQuote(): boolean {
    return false;
  }

  canAccept(): boolean {
    return true;
  }

  canReject(): boolean {
    return true;
  }

  canCancel(): boolean {
    return true;
  }

  canNegotiate(): boolean {
    return true;
  }

  canEdit(): boolean {
    return true;
  }

  getAvailableActions(): string[] {
    const actions: string[] = [];
    if (this.canAccept()) actions.push('accept');
    if (this.canReject()) actions.push('reject');
    if (this.canNegotiate()) actions.push('negotiate');
    if (this.canCancel()) actions.push('cancel');
    if (this.canEdit()) actions.push('edit');
    return actions;
  }
}
