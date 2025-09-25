import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class PendingServiceHiringState implements ServiceHiringStateInterface {
  canQuote(): boolean {
    return true;
  }

  canAccept(): boolean {
    return false;
  }

  canReject(): boolean {
    return false;
  }

  canCancel(): boolean {
    return true;
  }

  canNegotiate(): boolean {
    return false;
  }

  canEdit(): boolean {
    return false;
  }

  getAvailableActions(): string[] {
    const actions: string[] = [];
    if (this.canQuote()) actions.push('quote');
    if (this.canCancel()) actions.push('cancel');
    return actions;
  }
}
