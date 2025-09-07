import { RpcException } from '@nestjs/microservices';

export class CommentNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `comment with id ${id} not found`,
    });
  }
}

export class CommentNotOwnerException extends RpcException {
  constructor() {
    super({
      status: 403,
      message: 'you are not the owner of this comment',
    });
  }
}

export class CommentUserIdMismatchException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'user id mismatch in comment request',
    });
  }
}

export class CommentUpdateFailedException extends RpcException {
  constructor(id: number) {
    super({
      status: 500,
      message: `comment with id ${id} not found after update`,
    });
  }
}
