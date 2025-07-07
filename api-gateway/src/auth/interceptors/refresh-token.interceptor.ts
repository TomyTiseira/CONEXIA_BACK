/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

export interface RequestWithRefreshToken extends Request {
  refreshToken?: string;
}

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithRefreshToken>();

    // Extraer refresh token de las cookies
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    // Agregar el refresh token al request para que esté disponible en el controlador
    request.refreshToken = refreshToken;

    return next.handle();
  }
}
