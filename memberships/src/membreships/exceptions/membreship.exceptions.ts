import { RpcException } from '@nestjs/microservices';

export class MembreshipNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `Membership with id ${id} not found`,
    });
  }
}

export class MembreshipAlreadyExistsException extends RpcException {
  constructor(message: string) {
    super({
      status: 409,
      message: `Membership already exists: ${message}`,
    });
  }
}

export class MembreshipBadRequestException extends RpcException {
  constructor(message: string) {
    super({
      status: 400,
      message,
    });
  }
}

