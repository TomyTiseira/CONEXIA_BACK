import { PostulationStatusCode } from '../enums/postulation-status.enum';
import { PostulationState } from '../interfaces/postulation-state.interface';

export class ActivePostulationState implements PostulationState {
  canTransitionTo(newStatus: PostulationStatusCode): boolean {
    return [
      PostulationStatusCode.ACCEPTED,
      PostulationStatusCode.REJECTED,
      PostulationStatusCode.CANCELLED,
    ].includes(newStatus);
  }

  getStatus(): string {
    return PostulationStatusCode.ACTIVE;
  }

  getDisplayName(): string {
    return 'Activa';
  }

  canBeModified(): boolean {
    return true;
  }

  canBeCancelled(): boolean {
    return true;
  }

  canBeAccepted(): boolean {
    return true;
  }

  canBeRejected(): boolean {
    return true;
  }
}
