import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class RevisionRequestedServiceHiringState
  implements ServiceHiringStateInterface
{
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
    // El cliente solicitó cambios en una o más entregas
    // El prestador debe actualizar las entregas
    return ['update_delivery'];
  }
}
