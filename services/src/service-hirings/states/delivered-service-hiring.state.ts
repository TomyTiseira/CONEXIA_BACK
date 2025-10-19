import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class DeliveredServiceHiringState
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
    // El trabajo ha sido entregado, esperando revisión del cliente
    return ['review_delivery'];
  }
}
