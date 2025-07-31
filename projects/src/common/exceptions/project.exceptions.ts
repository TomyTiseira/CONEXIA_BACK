import { RpcException } from '@nestjs/microservices';

export class ProjectNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `Project with id ${id} not found`,
    });
  }
}

export class CategoryNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `Category with id ${id} not found`,
    });
  }
}

export class CollaborationTypeNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `Collaboration type with id ${id} not found`,
    });
  }
}

export class ContractTypeNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `Contract type with id ${id} not found`,
    });
  }
}

export class InvalidExecutionPeriodException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Start date must be before end date',
    });
  }
}

export class PastStartDateException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Start date cannot be in the past',
    });
  }
}

export class ProjectBadRequestException extends RpcException {
  constructor(message: string) {
    super({
      status: 400,
      message,
    });
  }
}

export class ProjectCreationFailedException extends RpcException {
  constructor() {
    super({
      status: 500,
      message: 'Failed to create project',
    });
  }
}

export class ProjectUpdateFailedException extends RpcException {
  constructor() {
    super({
      status: 500,
      message: 'Failed to update project',
    });
  }
}

export class ProjectDeletionFailedException extends RpcException {
  constructor() {
    super({
      status: 500,
      message: 'Failed to delete project',
    });
  }
}

export class UserNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `User with id ${id} not found`,
    });
  }
}

export class InvalidSkillsException extends RpcException {
  constructor(invalidIds: number[]) {
    super({
      status: 400,
      message: `Invalid skill IDs: ${invalidIds.join(', ')}`,
    });
  }
}

export class InvalidMaxCollaboratorsException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Max collaborators must be a positive number',
    });
  }
}
