import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class RequotingServiceHiringState
  implements ServiceHiringStateInterface
{
  canQuote(): boolean {
    return true; // El proveedor puede re-cotizar
  }

  canAccept(): boolean {
    return false;
  }

  canReject(): boolean {
    return false;
  }

  canCancel(): boolean {
    return true; // El cliente puede cancelar la solicitud de re-cotización
  }

  canNegotiate(): boolean {
    return false;
  }

  canEdit(): boolean {
    return true; // El proveedor puede editar/re-cotizar
  }

  getAvailableActions(): string[] {
    const actions: string[] = [];
    if (this.canCancel()) actions.push('cancel');
    return actions;
  }
}
