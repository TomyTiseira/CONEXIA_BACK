import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const error = exception.getError();

    // Si el error tiene la estructura que enviamos desde el microservicio
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      const errorObj = error as {
        statusCode: number;
        message: string;
        error: string;
      };

      response.status(errorObj.statusCode).json({
        statusCode: errorObj.statusCode,
        message: errorObj.message,
        error: errorObj.error,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    } else {
      // Fallback para errores no estructurados
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
