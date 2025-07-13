/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from '../../config';
import { jwtConfig } from '../../config/jwt.config';

@Injectable()
export class AutoRefreshJwtGuard extends AuthGuard('jwt') {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const accessToken = request.cookies?.access_token;
    const refreshToken = request.cookies?.refresh_token;

    // Si no hay ningún token, no autorizado
    if (!accessToken && !refreshToken) {
      throw new UnauthorizedException('No authentication tokens found');
    }

    try {
      // Intentar autenticar con el access token
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (error) {
      // Si falla la autenticación pero hay refresh token, intentar refresh
      if (refreshToken) {
        return await this.handleRefreshToken(request, response, refreshToken);
      }
      throw error;
    }
  }

  private async handleRefreshToken(
    request: Request,
    response: Response,
    refreshToken: string,
  ): Promise<boolean> {
    try {
      // Llamar al servicio de refresh token
      const result = await firstValueFrom(
        this.client.send('refreshToken', { refreshToken }),
      );

      if (result.success && result.data?.accessToken) {
        // Configurar nueva cookie de access token
        response.cookie('access_token', result.data.accessToken, {
          ...jwtConfig.cookieOptions,
          maxAge: result.data.expiresIn * 1000,
        });

        // Intentar autenticar con el nuevo token
        request.cookies.access_token = result.data.accessToken;
        const authResult = await super.canActivate({
          switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => response,
          }),
        } as ExecutionContext);

        return authResult as boolean;
      } else {
        throw new UnauthorizedException('Failed to refresh token');
      }
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
