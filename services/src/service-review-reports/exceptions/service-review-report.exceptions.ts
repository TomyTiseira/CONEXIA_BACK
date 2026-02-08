import { RpcException } from '@nestjs/microservices';

export class ServiceReviewNotFoundForReportException extends RpcException {
  constructor(serviceReviewId: number) {
    super({
      statusCode: 404,
      message: `Service review with ID ${serviceReviewId} does not exist`,
      error: 'Service Review Not Found',
    });
  }
}

export class ServiceReviewAlreadyReportedException extends RpcException {
  constructor() {
    super({
      statusCode: 400,
      message: 'You have already reported this review previously',
      error: 'Service Review Already Reported',
    });
  }
}

export class InvalidServiceReviewReportReasonException extends RpcException {
  constructor() {
    super({
      statusCode: 400,
      message:
        'You must provide a description when selecting "Other" as reason',
      error: 'Invalid Service Review Report Reason',
    });
  }
}

export class CannotReportOwnReviewException extends RpcException {
  constructor() {
    super({
      statusCode: 400,
      message: 'You cannot report your own review',
      error: 'Cannot Report Own Review',
    });
  }
}

export class MissingServiceReviewIdException extends RpcException {
  constructor() {
    super({
      statusCode: 400,
      message: 'serviceReviewId is required',
      error: 'Bad Request',
    });
  }
}

export class ServiceReviewReportInternalServerErrorException extends RpcException {
  constructor(message: string) {
    super({
      statusCode: 500,
      message:
        message ||
        'Internal server error occurred while processing service review report',
      error: 'Internal Server Error',
    });
  }
}
