import { PostulationState } from '../interfaces/postulation-state.interface';

export class RejectedPostulationState implements PostulationState {
  canTransitionTo(): boolean {
    return false; // Una vez rechazada, no puede cambiar de estado
  }

  getStatus(): string {
    return 'rechazada';
  }

  getDisplayName(): string {
    return 'Rechazada';
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
