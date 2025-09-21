import {
  CallHandler,
  ExecutionContext,
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

        // Para errores de validación o errores conocidos, los convertimos en RpcException
        if (
          error.name === 'ValidationError' ||
          error.name === 'QueryFailedError'
        ) {
          return throwError(
            () =>
              new RpcException({
                message: error.message || 'Validation failed',
                status: 400,
                error: 'Bad Request',
              }),
          );
        }

        // Para cualquier otro error, lo convertimos en RpcException
        return throwError(
          () =>
            new RpcException({
              message: error.message || 'Internal server error',
              status: 500,
              error: 'Internal Server Error',
            }),
        );
      }),
    );
  }
}
