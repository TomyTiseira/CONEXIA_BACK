import { RpcException } from '@nestjs/microservices';

export class ServiceNotFoundException extends RpcException {
  constructor(serviceId: number) {
    super({
      message: `Service with ID ${serviceId} not found`,
      status: 404,
      error: 'Service Not Found',
    });
  }
}

export class ServiceBadRequestException extends RpcException {
  constructor(message: string) {
    super({
      message,
      status: 400,
      error: 'Bad Request',
    });
  }
}

export class ServiceInternalServerErrorException extends RpcException {
  constructor(message: string) {
    super({
      message,
      status: 500,
      error: 'Internal Server Error',
    });
  }
}

export class UserNotFoundException extends RpcException {
  constructor(userId: number) {
    super({
      message: `User with ID ${userId} not found`,
      status: 404,
      error: 'User Not Found',
    });
  }
}

export class ServiceAccessForbiddenException extends RpcException {
  constructor(serviceId: number, userId: number) {
    super({
      message: `User ${userId} does not have access to service ${serviceId}`,
      status: 403,
      error: 'Access Forbidden',
    });
  }
}

export class ServiceNotOwnedByUserException extends RpcException {
  constructor(serviceId: number, userId: number) {
    super({
      message: `Service ${serviceId} does not belong to user ${userId}`,
      status: 403,
      error: 'Service Not Owned By User',
    });
  }
}

export class ServiceAlreadyDeletedException extends RpcException {
  constructor(serviceId: number) {
    super({
      message: `Service with ID ${serviceId} has already been deleted`,
      status: 409,
      error: 'Service Already Deleted',
    });
  }
}

export class ServiceHasActiveContractsException extends RpcException {
  constructor(serviceId: number) {
    super({
      message: `Service with ID ${serviceId} cannot be deleted because it has active contracts`,
      status: 409,
      error: 'Service Has Active Contracts',
    });
  }
}
