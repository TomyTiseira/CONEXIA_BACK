import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class NegotiatingServiceHiringState
  implements ServiceHiringStateInterface
{
  canQuote(): boolean {
    return true;
  }

  canAccept(): boolean {
    return false;
  }

  canReject(): boolean {
    return true;
  }

  canCancel(): boolean {
    return true;
  }

  canNegotiate(): boolean {
    return false;
  }

  canEdit(): boolean {
    return true;
  }

  getAvailableActions(): string[] {
    const actions: string[] = [];
    if (this.canQuote()) actions.push('quote');
    if (this.canReject()) actions.push('reject');
    if (this.canCancel()) actions.push('cancel');
    if (this.canEdit()) actions.push('edit');
    return actions;
  }
}
