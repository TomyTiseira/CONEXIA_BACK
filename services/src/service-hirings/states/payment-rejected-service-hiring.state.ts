import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class PaymentRejectedServiceHiringState
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
    return true; // El cliente puede cancelar definitivamente
  }

  canNegotiate(): boolean {
    return false;
  }

  canEdit(): boolean {
    return false;
  }

  getAvailableActions(): string[] {
    // El cliente puede reintentar el pago o cancelar la solicitud
    return ['retry_payment', 'cancel'];
  }
}
