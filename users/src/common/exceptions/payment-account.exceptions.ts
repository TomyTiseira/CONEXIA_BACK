import { RpcException } from '@nestjs/microservices';

export class PaymentAccountNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `Payment account with id ${id} not found`,
    });
  }
}

export class PaymentAccountAlreadyExistsException extends RpcException {
  constructor(identifier: string) {
    super({
      status: 409,
      message: `Payment account with ${identifier} already exists`,
    });
  }
}

export class BankNotFoundException extends RpcException {
  constructor(bankId: number) {
    super({
      status: 404,
      message: `Bank with id ${bankId} not found or inactive`,
    });
  }
}

export class DigitalPlatformNotFoundException extends RpcException {
  constructor(platformId: number) {
    super({
      status: 404,
      message: `Digital platform with id ${platformId} not found or inactive`,
    });
  }
}

export class InvalidCBUException extends RpcException {
  constructor(cbu: string) {
    super({
      status: 400,
      message: `Invalid CBU format: ${cbu}`,
    });
  }
}

export class InvalidCVUException extends RpcException {
  constructor(cvu: string) {
    super({
      status: 400,
      message: `Invalid CVU format: ${cvu}`,
    });
  }
}

export class InvalidAliasException extends RpcException {
  constructor(alias: string) {
    super({
      status: 400,
      message: `Invalid alias format: ${alias}`,
    });
  }
}

export class InvalidCuilCuitException extends RpcException {
  constructor(cuilCuit: string) {
    super({
      status: 400,
      message: `Invalid CUIL/CUIT format: ${cuilCuit}`,
    });
  }
}

export class MissingPaymentAccountDataException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Must provide either CBU/CVU or alias',
    });
  }
}

export class PaymentAccountValidationException extends RpcException {
  constructor(message: string) {
    super({
      status: 400,
      message,
    });
  }
}
