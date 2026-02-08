import { PostulationState } from '../interfaces/postulation-state.interface';

export class AcceptedPostulationState implements PostulationState {
  canTransitionTo(): boolean {
    return false; // Una vez aceptada, no puede cambiar de estado
  }

  getStatus(): string {
    return 'aceptada';
  }

  getDisplayName(): string {
    return 'Aceptada';
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
