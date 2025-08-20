import { RpcException } from '@nestjs/microservices';

export class SkillsNotFoundException extends RpcException {
  constructor(rubroId: number) {
    super({
      status: 404,
      message: `Skills for rubro with id ${rubroId} not found`,
    });
  }
}

export class RubroNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `Rubro with id ${id} not found`,
    });
  }
}
