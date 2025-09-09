// src/common/interceptors/response-format.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ResponseFormat } from '../interfaces/response.interface';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<any>> {
    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path: context.switchToHttp().getRequest().url as string,
      })),
      catchError((error) => {
        // No transformar errores, dejarlos pasar para que los maneje el filtro
        return throwError(() => error);
      }),
    );
  }
}
