import { RpcException } from '@nestjs/microservices';

export class ReportNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `Report with id ${id} not found`,
    });
  }
}

export class ProjectAlreadyReportedException extends RpcException {
  constructor(projectId: number, userId: number) {
    super({
      status: 409,
      message: `Project with id ${projectId} has already been reported by user ${userId}`,
    });
  }
}

export class ProjectBannedException extends RpcException {
  constructor(projectId: number) {
    super({
      status: 403,
      message: `Project with id ${projectId} is banned and cannot be reported`,
    });
  }
}

export class InvalidReportReasonException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Invalid report reason or missing other reason description',
    });
  }
}

export class UserNotAuthorizedException extends RpcException {
  constructor() {
    super({
      status: 403,
      message: 'User is not authorized to perform this action',
    });
  }
}
