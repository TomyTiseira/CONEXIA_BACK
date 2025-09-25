import { ServiceHiring } from '../entities/service-hiring.entity';
import { ServiceHiringStateInterface } from '../interfaces/service-hiring-state.interface';

export class ServiceHiringContext {
  private state: ServiceHiringStateInterface;
  private hiring: ServiceHiring;

  constructor(hiring: ServiceHiring, state: ServiceHiringStateInterface) {
    this.hiring = hiring;
    this.state = state;
  }

  setState(state: ServiceHiringStateInterface): void {
    this.state = state;
  }

  getState(): ServiceHiringStateInterface {
    return this.state;
  }

  getHiring(): ServiceHiring {
    return this.hiring;
  }

  canQuote(): boolean {
    return this.state.canQuote();
  }

  canAccept(): boolean {
    return this.state.canAccept();
  }

  canReject(): boolean {
    return this.state.canReject();
  }

  canCancel(): boolean {
    return this.state.canCancel();
  }

  canNegotiate(): boolean {
    return this.state.canNegotiate();
  }

  canEdit(): boolean {
    return this.state.canEdit();
  }

  getAvailableActions(): string[] {
    return this.state.getAvailableActions();
  }
}
