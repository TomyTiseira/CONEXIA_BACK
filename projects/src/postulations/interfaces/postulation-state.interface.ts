import { Postulation } from '../entities/postulation.entity';

export interface PostulationState {
  canTransitionTo(newStatus: string): boolean;
  getStatus(): string;
  getDisplayName(): string;
  canBeModified(): boolean;
  canBeCancelled(): boolean;
  canBeAccepted(): boolean;
  canBeRejected(): boolean;
}

export interface PostulationContext {
  getPostulation(): Postulation;
  setState(state: PostulationState): void;
  getCurrentState(): PostulationState;
}
