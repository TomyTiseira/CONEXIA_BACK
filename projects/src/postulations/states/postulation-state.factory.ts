import { PostulationStatusCode } from '../enums/postulation-status.enum';
import { PostulationState } from '../interfaces/postulation-state.interface';
import { AcceptedPostulationState } from './accepted-postulation.state';
import { ActivePostulationState } from './active-postulation.state';
import { CancelledPostulationState } from './cancelled-postulation.state';
import { RejectedPostulationState } from './rejected-postulation.state';

export class PostulationStateFactory {
  static createState(statusCode: PostulationStatusCode): PostulationState {
    switch (statusCode) {
      case PostulationStatusCode.ACTIVE:
        return new ActivePostulationState();
      case PostulationStatusCode.ACCEPTED:
        return new AcceptedPostulationState();
      case PostulationStatusCode.REJECTED:
        return new RejectedPostulationState();
      case PostulationStatusCode.CANCELLED:
        return new CancelledPostulationState();
      default:
        throw new Error(`Invalid postulation status: ${statusCode as string}`);
    }
  }
}
