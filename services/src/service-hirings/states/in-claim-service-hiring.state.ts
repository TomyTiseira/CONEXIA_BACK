import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

/**
 * Estado: IN_CLAIM
 * El servicio tiene un reclamo activo
 * Todas las acciones están congeladas hasta que se resuelva el reclamo
 */
export class InClaimServiceHiringState implements ServiceHiringStateInterface {
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
    // Solo admins/moderadores pueden cancelar durante un reclamo
    return false;
  }

  canNegotiate(): boolean {
    return false;
  }

  canEdit(): boolean {
    return false;
  }

  getAvailableActions(): string[] {
    // Solo admins/moderadores pueden resolver reclamos
    // No hay acciones disponibles para cliente/proveedor
    return [];
  }
}
