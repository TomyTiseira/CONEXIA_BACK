import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

/**
 * Estado: Finalizado por reclamo
 * Este estado se alcanza cuando un reclamo se resuelve a favor del proveedor
 * La contratación se marca como finalizada y el proveedor recibirá el pago completo
 */
export class CompletedByClaimServiceHiringState
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
