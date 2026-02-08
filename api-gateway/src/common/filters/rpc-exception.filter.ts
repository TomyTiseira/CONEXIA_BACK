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
    // Soportamos tanto 'statusCode' como 'status' para compatibilidad
    if (
      typeof error === 'object' &&
      error !== null &&
      ('statusCode' in error || 'status' in error)
    ) {
      const errorObj = error as {
        statusCode?: number;
        status?: number;
        message: string;
        error?: string;
        code?: string;
        errors?: any[];
      };

      // Asegurar que statusCode sea un número válido
      const rawStatusCode = errorObj.statusCode || errorObj.status;
      const statusCode =
        typeof rawStatusCode === 'number' &&
        Number.isInteger(rawStatusCode) &&
        rawStatusCode >= 100 &&
        rawStatusCode < 600
          ? rawStatusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const errorName = errorObj.error || errorObj.code || 'Error';

      const responseBody: any = {
        statusCode: statusCode,
        message: errorObj.message,
        error: errorName,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      // Incluir errores de validación si existen
      if (errorObj.errors) {
        responseBody.errors = errorObj.errors;
      }

      response.status(statusCode).json(responseBody);
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
