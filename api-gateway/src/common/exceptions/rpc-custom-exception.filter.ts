import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const rpcError = exception.getError();

    if (
      typeof rpcError === 'object' &&
      'status' in rpcError &&
      'message' in rpcError
    ) {
      const status = isNaN(Number(rpcError.status))
        ? 500
        : Number(rpcError.status);

      return response.status(status).json({
        status,
        message: rpcError.message,
      });
    }

    return response.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
}
