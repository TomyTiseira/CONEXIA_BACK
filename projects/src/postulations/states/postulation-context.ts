import { Postulation } from '../entities/postulation.entity';
import { PostulationState } from '../interfaces/postulation-state.interface';
import { PostulationStateFactory } from './postulation-state.factory';

export class PostulationContext implements PostulationContext {
  private currentState: PostulationState;
  private postulation: Postulation;

  constructor(postulation: Postulation) {
    this.postulation = postulation;
    this.currentState = PostulationStateFactory.createState(
      postulation.status.code,
    );
  }

  getPostulation(): Postulation {
    return this.postulation;
  }

  setState(state: PostulationState): void {
    this.currentState = state;
  }

  getCurrentState(): PostulationState {
    return this.currentState;
  }

  canTransitionTo(newStatus: string): boolean {
    return this.currentState.canTransitionTo(newStatus);
  }

  getStatus(): string {
    return this.currentState.getStatus();
  }

  getDisplayName(): string {
    return this.currentState.getDisplayName();
  }

  canBeModified(): boolean {
    return this.currentState.canBeModified();
  }

  canBeCancelled(): boolean {
    return this.currentState.canBeCancelled();
  }

  canBeAccepted(): boolean {
    return this.currentState.canBeAccepted();
  }

  canBeRejected(): boolean {
    return this.currentState.canBeRejected();
  }
}
