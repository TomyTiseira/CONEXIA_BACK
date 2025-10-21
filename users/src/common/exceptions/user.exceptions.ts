import { RpcException } from '@nestjs/microservices';

export class UserAlreadyExistsException extends RpcException {
  constructor(email: string) {
    super({
      status: 409,
      message: `User with email ${email} already exists`,
    });
  }
}

export class UserNotFoundException extends RpcException {
  constructor(email: string) {
    super({
      status: 404,
      message: `User with email ${email} not found`,
    });
  }
}

export class UserNotFoundByIdException extends RpcException {
  constructor(id: number) {
    super({
      status: 404,
      message: `User with id ${id} not found`,
    });
  }
}

export class UserNotAllowedToDeleteException extends RpcException {
  constructor(id: number) {
    super({
      status: 400,
      message: `User with id ${id} is not allowed to delete`,
    });
  }
}

export class UserNotAllowedToUpdateException extends RpcException {
  constructor(id: number) {
    super({
      status: 400,
      message: `User with id ${id} is not allowed to update`,
    });
  }
}

export class UserNotAdminOrModeratorException extends RpcException {
  constructor(id: number) {
    super({
      status: 400,
      message: `User with id ${id} is not admin or moderator`,
    });
  }
}

export class RoleNotAdminOrModeratorException extends RpcException {
  constructor(id: number) {
    super({
      status: 400,
      message: `Role with id ${id} is not admin or moderator`,
    });
  }
}

export class UserAlreadyActiveException extends RpcException {
  constructor(email: string) {
    super({
      status: 400,
      message: `User with email ${email} is already active`,
    });
  }
}

export class UserAlreadyDeletedException extends RpcException {
  constructor(id: number) {
    super({
      status: 400,
      message: `User with id ${id} is already deleted`,
    });
  }
}

export class InvalidVerificationCodeException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Invalid verification code',
    });
  }
}

export class VerificationCodeExpiredException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Verification code has expired',
    });
  }
}

export class MissingRequiredFieldsException extends RpcException {
  constructor(fields: string[]) {
    super({
      status: 400,
      message: `Missing required fields: ${fields.join(', ')}`,
    });
  }
}

export class UserActivationFailedException extends RpcException {
  constructor() {
    super({
      status: 500,
      message: 'Failed to activate user',
    });
  }
}

export class VerificationCodeUpdateFailedException extends RpcException {
  constructor() {
    super({
      status: 500,
      message: 'Failed to update verification code',
    });
  }
}

export class RoleNotFoundException extends RpcException {
  constructor(roleName: string) {
    super({
      status: 404,
      message: `Role "${roleName}" not found in database`,
    });
  }
}

export class UserBadRequestException extends RpcException {
  constructor(message: string) {
    super({
      status: 400,
      message,
    });
  }
}

export class RoleIdNotFoundException extends RpcException {
  constructor(roleId: number) {
    super({
      status: 404,
      message: `Role with id ${roleId} not found in database`,
    });
  }
}

export class RoleIdInvalidException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Role ID must be a number',
    });
  }
}

export class InvalidRoleException extends RpcException {
  constructor(roleId: number) {
    super({
      status: 400,
      message: `Role with id ${roleId} is invalid`,
    });
  }
}

export class UserNotVerifiedException extends RpcException {
  constructor() {
    super({
      status: 401,
      message: 'The account is not verified',
    });
  }
}

export class InvalidCredentialsException extends RpcException {
  constructor() {
    super({
      status: 401,
      message: 'Invalid credentials',
    });
  }
}

export class ProfileNotFoundException extends RpcException {
  constructor() {
    super({
      status: 404,
      message: 'Profile not found',
    });
  }
}

export class InvalidPasswordResetCodeException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Invalid password reset code',
    });
  }
}

export class PasswordResetCodeExpiredException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Password reset code has expired',
    });
  }
}

export class NewPasswordSameAsCurrentException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'New password cannot be the same as the current password',
    });
  }
}

export class InvalidCurrentPasswordException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'Invalid current password',
    });
  }
}

export class RoleModificationException extends RpcException {
  constructor(roleId: number) {
    super({
      status: 400,
      message: `Role with id ${roleId} cannot be modified to a lower role`,
    });
  }
}

export class ProfileAlreadyExistsException extends RpcException {
  constructor(documentNumber: string) {
    super({
      status: 409,
      message: `Profile with document number ${documentNumber} already exists`,
    });
  }
}

// User Review Exceptions
export class UserCannotReviewSelfException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'You cannot review yourself',
    });
  }
}

export class UserReviewNotFoundException extends RpcException {
  constructor(reviewId: number) {
    super({
      status: 404,
      message: `User review with id ${reviewId} not found`,
    });
  }
}

export class UserNotFoundForReviewException extends RpcException {
  constructor(userId: number) {
    super({
      status: 404,
      message: `User with id ${userId} not found for review`,
    });
  }
}
