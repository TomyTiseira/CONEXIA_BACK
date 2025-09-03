import { RpcException } from '@nestjs/microservices';

export class CannotSendConnectionToSelfException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'not possible to send connection to yourself',
    });
  }
}

export class ConnectionAlreadyExistsException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'a pending connection request already exists with this user',
    });
  }
}

export class ConnectionNotFoundException extends RpcException {
  constructor() {
    super({
      status: 404,
      message: 'connection request not found',
    });
  }
}

export class UnauthorizedConnectionResponseException extends RpcException {
  constructor() {
    super({
      status: 403,
      message: 'you do not have permission to respond to this request',
    });
  }
}

export class ConnectionAlreadyRespondedException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'this request has already been responded to',
    });
  }
}

export class UserNotFoundException extends RpcException {
  constructor() {
    super({
      status: 404,
      message: 'user not found',
    });
  }
}

export class InternalServerErrorException extends RpcException {
  constructor() {
    super({
      status: 500,
      message: 'internal server error',
    });
  }
}
