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

      const errorResponse: any = {
        status: 'error',
        message: rpcError.message,
        statusCode: status,
      };

      // Si hay errores de validación específicos, los incluimos
      if ('errors' in rpcError && Array.isArray(rpcError.errors)) {
        errorResponse.errors = rpcError.errors;
      }

      return response.status(status).json(errorResponse);
    }

    // Si es un error de validación de class-validator
    if (
      typeof rpcError === 'string' &&
      rpcError.includes('Validation failed')
    ) {
      return response.status(400).json({
        status: 'error',
        message: rpcError,
        statusCode: 400,
      });
    }

    return response.status(500).json({
      status: 'error',
      message: 'Internal server error',
      statusCode: 500,
    });
  }
}
