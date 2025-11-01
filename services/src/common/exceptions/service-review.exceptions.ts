import { RpcException } from '@nestjs/microservices';

/**
 * Exception: Review not found
 * Status: 404
 */
export class ServiceReviewNotFoundException extends RpcException {
  constructor(reviewId: number) {
    super({
      status: 404,
      message: `Service review with id ${reviewId} not found`,
      error: 'Service Review Not Found',
    });
  }
}

/**
 * Exception: Service hiring not found
 * Status: 404
 */
export class ServiceHiringNotFoundException extends RpcException {
  constructor(hiringId: number) {
    super({
      status: 404,
      message: `Service hiring with id ${hiringId} not found`,
      error: 'Service Hiring Not Found',
    });
  }
}

/**
 * Exception: Service hiring not completed
 * Status: 400
 */
export class ServiceHiringNotCompletedException extends RpcException {
  constructor(hiringId: number) {
    super({
      status: 400,
      message: `Service hiring with id ${hiringId} is not completed yet. Only completed services can be reviewed`,
      error: 'Service Hiring Not Completed',
    });
  }
}

/**
 * Exception: User is not the client of the hiring
 * Status: 403
 */
export class UserNotClientOfHiringException extends RpcException {
  constructor(hiringId: number) {
    super({
      status: 403,
      message: `You are not the client of service hiring ${hiringId}. Only clients can review services`,
      error: 'User Not Client Of Hiring',
    });
  }
}

/**
 * Exception: Review already exists for this hiring
 * Status: 400
 */
export class ReviewAlreadyExistsException extends RpcException {
  constructor(hiringId: number) {
    super({
      status: 400,
      message: `A review already exists for service hiring ${hiringId}. You can only review a service once`,
      error: 'Review Already Exists',
    });
  }
}

/**
 * Exception: User can only update their own reviews
 * Status: 403
 */
export class ReviewUpdateForbiddenException extends RpcException {
  constructor() {
    super({
      status: 403,
      message: 'You can only update your own reviews',
      error: 'Review Update Forbidden',
    });
  }
}

/**
 * Exception: User can only delete their own reviews
 * Status: 403
 */
export class ReviewDeleteForbiddenException extends RpcException {
  constructor() {
    super({
      status: 403,
      message: 'You can only delete your own reviews',
      error: 'Review Delete Forbidden',
    });
  }
}

/**
 * Exception: Only service owner can respond to reviews
 * Status: 403
 */
export class OnlyServiceOwnerCanRespondException extends RpcException {
  constructor() {
    super({
      status: 403,
      message: 'Only the service owner can respond to this review',
      error: 'Only Service Owner Can Respond',
    });
  }
}

/**
 * Exception: Only service owner can delete their response
 * Status: 403
 */
export class OnlyServiceOwnerCanDeleteResponseException extends RpcException {
  constructor() {
    super({
      status: 403,
      message: 'Only the service owner can delete their response',
      error: 'Only Service Owner Can Delete Response',
    });
  }
}

/**
 * Exception: No response exists to delete
 * Status: 404
 */
export class ReviewResponseNotFoundException extends RpcException {
  constructor() {
    super({
      status: 404,
      message: 'There is no response to delete',
      error: 'Review Response Not Found',
    });
  }
}

/**
 * Exception: Service review bad request
 * Status: 400
 */
export class ServiceReviewBadRequestException extends RpcException {
  constructor(message: string) {
    super({
      status: 400,
      message,
      error: 'Bad Request',
    });
  }
}

/**
 * Exception: Service review internal server error
 * Status: 500
 */
export class ServiceReviewInternalServerErrorException extends RpcException {
  constructor(message: string) {
    super({
      status: 500,
      message,
      error: 'Internal Server Error',
    });
  }
}

export class ReviewHasAssociatedReportsException extends RpcException {
  constructor() {
    super({
      status: 409,
      message: 'Cannot delete review because it has associated reports. Please contact support.',
      error: 'Foreign Key Constraint Violation',
    });
  }
}
