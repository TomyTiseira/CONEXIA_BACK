import { RpcException } from '@nestjs/microservices';

export class ServiceReportNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `Service report with id ${id} not found`,
      error: 'Service Report Not Found',
    });
  }
}

export class ServiceAlreadyReportedException extends RpcException {
  constructor(serviceId: number) {
    super({
      status: 400,
      message: `Service with id ${serviceId} has already been reported by this user`,
      error: 'Service Already Reported',
    });
  }
}

export class ServiceNotActiveException extends RpcException {
  constructor(serviceId: number) {
    super({
      status: 400,
      message: `Service with id ${serviceId} is not active`,
      error: 'Service Not Active',
    });
  }
}

export class ServiceDeletedException extends RpcException {
  constructor(serviceId: number) {
    super({
      status: 400,
      message: `Service with id ${serviceId} has been deleted`,
      error: 'Service Deleted',
    });
  }
}

export class ServiceOwnerCannotReportException extends RpcException {
  constructor(serviceId: number) {
    super({
      status: 400,
      message: `You cannot report your own service with id ${serviceId}`,
      error: 'Service Owner Cannot Report',
    });
  }
}

export class InvalidServiceReportReasonException extends RpcException {
  constructor(message: string) {
    super({
      status: 400,
      message,
      error: 'Invalid Report Reason',
    });
  }
}

export class ServiceReportBadRequestException extends RpcException {
  constructor(message: string) {
    super({
      status: 400,
      message,
      error: 'Bad Request',
    });
  }
}

export class ServiceReportInternalServerErrorException extends RpcException {
  constructor(message: string) {
    super({
      status: 500,
      message,
      error: 'Internal Server Error',
    });
  }
}
