import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class RpcExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Si ya es una RpcException, la devolvemos tal como está
        if (error instanceof RpcException) {
          return throwError(() => error);
        }

        // Si es una HttpException (BadRequestException, NotFoundException, ForbiddenException, etc.)
        if (error instanceof HttpException) {
          const response = error.getResponse();
          const status = error.getStatus();

          return throwError(
            () =>
              new RpcException({
                statusCode: status,
                message:
                  typeof response === 'string'
                    ? response
                    : (response as any).message || error.message,
                error:
                  typeof response === 'object' && 'error' in response
                    ? (response as any).error
                    : error.name,
              }),
          );
        }

        // Para errores de validación o errores conocidos
        if (
          error.name === 'ValidationError' ||
          error.name === 'QueryFailedError'
        ) {
          return throwError(
            () =>
              new RpcException({
                message: error.message || 'Validation failed',
                statusCode: 400,
                error: 'Bad Request',
              }),
          );
        }

        // Para cualquier otro error, lo convertimos en RpcException
        return throwError(
          () =>
            new RpcException({
              message: error.message || 'Internal server error',
              statusCode: 500,
              error: 'Internal Server Error',
            }),
        );
      }),
    );
  }
}
