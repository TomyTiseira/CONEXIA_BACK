import { RpcException } from '@nestjs/microservices';

export class PostulationNotFoundException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `Postulation with id ${id} not found`,
    });
  }
}

export class ProjectNotActiveException extends RpcException {
  constructor(projectId: number) {
    super({
      status: 400,
      message: `Project with id ${projectId} is not active`,
    });
  }
}

export class ProjectEndedException extends RpcException {
  constructor(projectId: number) {
    super({
      status: 400,
      message: `Project with id ${projectId} has already ended`,
    });
  }
}

export class UserAlreadyAppliedException extends RpcException {
  constructor(projectId: number, userId: number) {
    super({
      status: 409,
      message: `User ${userId} has already applied to project ${projectId}`,
    });
  }
}

export class ProjectOwnerCannotApplyException extends RpcException {
  constructor(projectId: number, userId: number) {
    super({
      status: 403,
      message: `User ${userId} cannot apply to their own project ${projectId}`,
    });
  }
}

export class InvalidUserRoleException extends RpcException {
  constructor(userId: number) {
    super({
      status: 403,
      message: `User ${userId} does not have the required role to apply`,
    });
  }
}

export class CvFileTooLargeException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'CV file size cannot exceed 10MB',
    });
  }
}

export class InvalidCvFileTypeException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Only PDF files are allowed for CV',
    });
  }
}

export class PostulationCreationFailedException extends RpcException {
  constructor() {
    super({
      status: 500,
      message: 'Failed to create postulation',
    });
  }
}

export class ProjectMaxCollaboratorsReachedException extends RpcException {
  constructor(projectId: number) {
    super({
      status: 400,
      message: `Project with id ${projectId} has reached the maximum number of collaborators`,
    });
  }
}

export class ProjectOwnerCannotApproveException extends RpcException {
  constructor(projectId: number, userId: number) {
    super({
      status: 403,
      message: `User ${userId} cannot approve postulation for project ${projectId}`,
    });
  }
}

export class PostulationNotPendingException extends RpcException {
  constructor(postulationId: number) {
    super({
      status: 400,
      message: `Postulation with id ${postulationId} is not pending`,
    });
  }
}

export class PostulationStatusNotFoundException extends RpcException {
  constructor() {
    super({
      status: 404,
      message: 'Postulation status not found',
    });
  }
}

export class UserNotActiveException extends RpcException {
  constructor(userId: number) {
    super({
      status: 400,
      message: `User with id ${userId} is not active`,
    });
  }
}

export class ProjectAccessForbiddenException extends RpcException {
  constructor(projectId: number, userId: number) {
    super({
      status: 403,
      message: `User ${userId} is not authorized to view postulations for project ${projectId}. Only the project owner can access this resource.`,
    });
  }
}

export class PostulationNotActiveException extends RpcException {
  constructor(postulationId: number) {
    super({
      status: 400,
      message: `Postulation with id ${postulationId} is not active and cannot be cancelled`,
    });
  }
}

export class UserNotPostulationOwnerException extends RpcException {
  constructor(postulationId: number, userId: number) {
    super({
      status: 403,
      message: `User ${userId} is not authorized to cancel postulation ${postulationId}. Only the postulation owner can cancel it.`,
    });
  }
}

export class PostulationCannotBeRejectedException extends RpcException {
  constructor(postulationId: number, currentState: string) {
    super({
      status: 400,
      message: `Postulation with id ${postulationId} cannot be rejected in its current state: ${currentState}`,
    });
  }
}

export class PostulationCannotTransitionToRejectedException extends RpcException {
  constructor(postulationId: number, currentState: string) {
    super({
      status: 400,
      message: `Postulation with id ${postulationId} cannot transition to rejected state from current state: ${currentState}`,
    });
  }
}

export class PostulationCannotBeCancelledException extends RpcException {
  constructor(postulationId: number, currentState: string) {
    super({
      status: 400,
      message: `Postulation with id ${postulationId} cannot be cancelled in its current state: ${currentState}`,
    });
  }
}

export class PostulationCannotTransitionToCancelledException extends RpcException {
  constructor(postulationId: number, currentState: string) {
    super({
      status: 400,
      message: `Postulation with id ${postulationId} cannot transition to cancelled state from current state: ${currentState}`,
    });
  }
}

export class PostulationStatusUpdateFailedException extends RpcException {
  constructor(postulationId: number) {
    super({
      status: 500,
      message: `Failed to update postulation ${postulationId} status`,
    });
  }
}

export class PostulationHasNoValidStatusException extends RpcException {
  constructor(postulationId: number, statusId: number) {
    super({
      status: 500,
      message: `Postulation with id ${postulationId} has no valid status. StatusId: ${statusId}`,
    });
  }
}

export class UserNotProjectOwnerException extends RpcException {
  constructor(projectId: number, userId: number) {
    super({
      status: 403,
      message: `User ${userId} is not the owner of project ${projectId}`,
    });
  }
}

export class RoleNotBelongToProjectException extends RpcException {
  constructor(roleId: number, projectId: number) {
    super({
      status: 400,
      message: `Role ${roleId} does not belong to project ${projectId}`,
    });
  }
}
