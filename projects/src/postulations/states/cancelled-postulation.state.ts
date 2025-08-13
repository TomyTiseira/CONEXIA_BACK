import { PostulationState } from '../interfaces/postulation-state.interface';

export class CancelledPostulationState implements PostulationState {
  canTransitionTo(): boolean {
    return false; // Una vez cancelada, no puede cambiar de estado
  }

  getStatus(): string {
    return 'cancelada';
  }

  getDisplayName(): string {
    return 'Cancelada';
  }

  canBeModified(): boolean {
    return false;
  }

  canBeCancelled(): boolean {
    return false;
  }

  canBeAccepted(): boolean {
    return false;
  }

  canBeRejected(): boolean {
    return false;
  }
}
