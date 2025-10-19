import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

/**
 * Estado: Finalizado con acuerdo
 * Este estado se alcanza cuando un reclamo se resuelve con un acuerdo parcial
 * Ambas partes llegaron a un acuerdo (puede incluir pago parcial u otros términos)
 */
export class CompletedWithAgreementServiceHiringState
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
