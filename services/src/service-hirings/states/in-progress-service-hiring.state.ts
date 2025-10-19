import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class InProgressServiceHiringState
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
    return true; // Puede cancelarse si hay problemas
  }

  canNegotiate(): boolean {
    return false;
  }

  canEdit(): boolean {
    return false;
  }

  getAvailableActions(): string[] {
    // El servicio está en progreso
    return ['deliver', 'cancel'];
  }
}
