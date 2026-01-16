import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class FinishedByModerationServiceHiringState
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
    // El servicio publicado ha sido finalizado por moderación (proveedor baneado)
    return [];
  }
}
