import { RpcException } from '@nestjs/microservices';

export class CommentNotFoundException extends RpcException {
  constructor(commentId: number) {
    super({
      status: 404,
      message: `Comment with ID ${commentId} not found`,
      error: 'COMMENT_NOT_FOUND',
    });
  }
}

export class CommentNotActiveException extends RpcException {
  constructor(commentId: number) {
    super({
      status: 400,
      message: `Comment with ID ${commentId} is not active or has been deleted`,
      error: 'COMMENT_NOT_ACTIVE',
    });
  }
}

export class CommentAlreadyReportedException extends RpcException {
  constructor(userId: number, commentId: number) {
    super({
      status: 409,
      message: `User ${userId} has already reported comment ${commentId}`,
      error: 'COMMENT_ALREADY_REPORTED',
    });
  }
}

export class InvalidReportReasonException extends RpcException {
  constructor(message: string) {
    super({
      status: 400,
      message: message,
      error: 'INVALID_REPORT_REASON',
    });
  }
}
