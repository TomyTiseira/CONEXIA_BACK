import { RpcException } from '@nestjs/microservices';

export class PublicationNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `publication with id ${id} not found`,
    });
  }
}
// You are not the owner of this publication
export class PublicationNotOwnerException extends RpcException {
  constructor() {
    super({
      status: 403,
      message: `you are not the owner of this publication`,
    });
  }
}
