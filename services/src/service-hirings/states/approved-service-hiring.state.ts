import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class ApprovedServiceHiringState implements ServiceHiringStateInterface {
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
    // Una vez aprobado, el servicio está listo para comenzar
    // Las próximas acciones serían marcar como "in_progress" y luego "completed"
    return ['start_service'];
  }
}
