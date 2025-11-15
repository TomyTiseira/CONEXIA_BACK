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
import { ValidationError } from 'class-validator';

@Injectable()
export class RpcExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Si ya es una RpcException, la devolvemos tal como está
        if (error instanceof RpcException) {
          return throwError(() => error);
        }

        // Si es un error de validación (BadRequestException)
        if (error.status === 400 && error.response) {
          // format class-validator ValidationError[] into plain serializable objects
          const rawErrors = Array.isArray(error.response.message)
            ? error.response.message
            : [];

          const formatValidationError = (ve: ValidationError): any => {
            const out: any = { property: ve.property };
            if (ve.constraints) {
              out.constraints = ve.constraints;
            }
            if (ve.children && ve.children.length) {
              out.children = ve.children.map((c) => formatValidationError(c));
            }
            return out;
          };

          const formatted = rawErrors.map((r: any) =>
            r instanceof Object && 'property' in r ? formatValidationError(r as ValidationError) : r,
          );

          return throwError(
            () =>
              new RpcException({
                status: 400,
                message: 'Validation failed',
                errors: formatted,
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
