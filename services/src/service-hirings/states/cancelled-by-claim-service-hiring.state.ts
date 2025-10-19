import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

/**
 * Estado: Cancelado por reclamo
 * Este estado se alcanza cuando un reclamo se resuelve a favor del cliente
 * La contratación se cancela y no habrá pago
 */
export class CancelledByClaimServiceHiringState
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
    // Estado final - no hay acciones disponibles
    return [];
  }
}
