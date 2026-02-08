import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class PaymentPendingServiceHiringState
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
    return true; // El cliente puede cancelar si no quiere completar el pago
  }

  canNegotiate(): boolean {
    return false;
  }

  canEdit(): boolean {
    return false;
  }

  getAvailableActions(): string[] {
    // No hay acciones disponibles mientras el pago está pendiente
    // El cliente debe completar el pago en MercadoPago
    return [];
  }
}
