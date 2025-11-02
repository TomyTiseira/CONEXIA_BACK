import { RpcException } from '@nestjs/microservices';

export class BenefitNotFoundException extends RpcException {
  constructor(key: string) {
    super({
      message: `benefit with key '${key}' not found`,
      status: 404,
      error: 'Benefit Not Found',
    });
  }
}
