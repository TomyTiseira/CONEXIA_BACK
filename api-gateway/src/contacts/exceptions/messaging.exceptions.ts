import { RpcException } from '@nestjs/microservices';

export class FileSizeExceededException extends RpcException {
  constructor(maxSize: string) {
    super({
      status: 400,
      message: `the file size exceeded the maximum allowed size of ${maxSize}`,
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

export class FileRequiredException extends RpcException {
  constructor(fileType: string) {
    super({
      status: 400,
      message: `file ${fileType} is required`,
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
