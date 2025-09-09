import { RpcException } from '@nestjs/microservices';

export class NoConnectionException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'no connection found between users',
    });
  }
}

export class EmptyMessageContentException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'the text message content cannot be empty',
    });
  }
}

export class FileRequiredException extends RpcException {
  constructor(fileType: string) {
    super({
      status: 400,
      message: `file ${fileType} is required`,
    });
  }
}

export class ConversationNotFoundException extends RpcException {
  constructor() {
    super({
      status: 404,
      message: 'conversation not found',
    });
  }
}

export class ConversationAccessDeniedException extends RpcException {
  constructor() {
    super({
      status: 403,
      message: 'you do not have access to this conversation',
    });
  }
}

export class InvalidMessageTypeException extends RpcException {
  constructor() {
    super({
      status: 400,
      message: 'invalid message type',
    });
  }
}

export class FileSizeExceededException extends RpcException {
  constructor(maxSize: string) {
    super({
      status: 400,
      message: `file size exceeded the maximum allowed size of ${maxSize}`,
    });
  }
}

export class InvalidFileTypeException extends RpcException {
  constructor(allowedTypes: string[]) {
    super({
      status: 400,
      message: `file type not allowed. allowed types: ${allowedTypes.join(', ')}`,
    });
  }
}
