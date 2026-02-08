import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class ExpiredServiceHiringState implements ServiceHiringStateInterface {
  canQuote(): boolean {
    return false;
  }

  canAccept(): boolean {
    return false;
  }

  canReject(): boolean {
    return false;
  }

  canCancel(): boolean {
    return false;
  }

  canNegotiate(): boolean {
    return false;
  }

  canEdit(): boolean {
    return false;
  }

  getAvailableActions(): string[] {
    // La cotización ha expirado, no hay acciones disponibles
    return [];
  }
}
