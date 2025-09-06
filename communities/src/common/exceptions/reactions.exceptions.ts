import { RpcException } from '@nestjs/microservices';

export class ReactionNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `reaction with id ${id} not found`,
    });
  }
}

export class ReactionNotOwnerException extends RpcException {
  constructor() {
    super({
      status: 403,
      message: 'you are not the owner of this reaction',
    });
  }
}

export class ReactionUserIdMismatchException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'user id mismatch in reaction request',
    });
  }
}

export class ReactionUpdateFailedException extends RpcException {
  constructor(id: number) {
    super({
      status: 500,
      message: `reaction with id ${id} not found after update`,
    });
  }
}
