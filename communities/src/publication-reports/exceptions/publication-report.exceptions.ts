export class PublicationNotFoundException extends Error {
  constructor(publicationId: number) {
    super(`Publication with ID ${publicationId} not found`);
    this.name = 'PublicationNotFoundException';
  }
}

export class PublicationNotActiveException extends Error {
  constructor(publicationId: number) {
    super(`Publication with ID ${publicationId} is not active`);
    this.name = 'PublicationNotActiveException';
  }
}

export class PublicationAlreadyReportedException extends Error {
  constructor(publicationId: number, userId: number) {
    super(`User ${userId} has already reported publication ${publicationId}`);
    this.name = 'PublicationAlreadyReportedException';
  }
}

export class UserNotFoundException extends Error {
  constructor(userId: number) {
    super(`User with ID ${userId} not found`);
    this.name = 'UserNotFoundException';
  }
}

export class InvalidReportReasonException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidReportReasonException';
  }
}
