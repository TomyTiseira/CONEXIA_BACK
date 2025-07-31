/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
        console.error('=== RPC EXCEPTION INTERCEPTOR ===');
        console.error('Original error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // Si ya es una RpcException, la devolvemos tal como está
        if (error instanceof RpcException) {
          return throwError(() => error);
        }

        // Si es un error de validación (BadRequestException)
        if (error.status === 400 && error.response) {
          return throwError(
            () =>
              new RpcException({
                status: 400,
                message: 'Validation error',
                errors: error.response.message,
              }),
          );
        }

        // Para cualquier otro error, lo convertimos en RpcException
        return throwError(
          () =>
            new RpcException({
              status: 500,
              message: 'Internal server error',
              details: error.message || 'An unexpected error occurred',
            }),
        );
      }),
    );
  }
}
