import { RpcException } from '@nestjs/microservices';

export class UserReviewNotFoundException extends RpcException {
  constructor() {
    super({
      message: 'Review not found',
      statusCode: 404,
      error: 'Not Found',
    });
  }
}

export class UserReviewForbiddenException extends RpcException {
  constructor() {
    super({
      message: 'You can only update your own reviews',
      statusCode: 403,
      error: 'Forbidden',
    });
  }
}

export class UserReviewDeleteForbiddenException extends RpcException {
  constructor() {
    super({
      message: 'You can only delete your own reviews',
      statusCode: 403,
      error: 'Forbidden',
    });
  }
}

export class UserReviewNotFoundAfterUpdateException extends RpcException {
  constructor() {
    super({
      message: 'Review not found after update',
      statusCode: 404,
      error: 'Not Found',
    });
  }
}
