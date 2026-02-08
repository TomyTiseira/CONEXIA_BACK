import { RpcException } from '@nestjs/microservices';

export class UserReviewNotFoundException extends RpcException {
  constructor(userReviewId: number) {
    super({
      message: `The review with ID ${userReviewId} does not exist`,
      code: 'USER_REVIEW_NOT_FOUND',
      status: 404,
    });
  }
}

export class UserAlreadyReportedException extends RpcException {
  constructor() {
    super({
      message: 'You have already reported this review previously',
      code: 'USER_ALREADY_REPORTED',
      status: 400,
    });
  }
}

export class InvalidReportReasonException extends RpcException {
  constructor() {
    super({
      message: 'You must provide a description when selecting "Other"',
      code: 'INVALID_REPORT_REASON',
      status: 400,
    });
  }
}
