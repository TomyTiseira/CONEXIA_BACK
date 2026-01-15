import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { firstValueFrom } from 'rxjs';
import { envs, NATS_SERVICE } from '../../config';

export interface JwtPayload {
  sub: number;
  email: string;
  roleId: number;
  profileId: number;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extraer de cookies
        (request: any) => {
          return request?.cookies?.access_token;
        },
        // Extraer de headers Authorization como fallback
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: envs.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // Verificar que sea un access token
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Verificar estado de cuenta en tiempo real (protección contra baneo durante sesión activa)
    let userStatus: any = {
      isBanned: false,
      isSuspended: false,
      banReason: null,
      suspensionExpiresAt: null,
    };

    try {
      userStatus = await firstValueFrom(
        this.natsClient.send('checkUserAccountStatus', { userId: payload.sub }),
      );

      // NOTA: tokensInvalidatedAt ya no se usa para suspensiones/baneos
      // El frontend maneja el cierre de sesión al recibir eventos WebSocket
      // Esta validación solo se mantiene para casos especiales (cambio de contraseña, etc.)
      /*
      if (userStatus.tokensInvalidatedAt && payload.iat) {
        const tokenIssuedAt = new Date(payload.iat * 1000); // JWT iat está en segundos
        const tokensInvalidatedAt = new Date(userStatus.tokensInvalidatedAt);

        if (tokenIssuedAt < tokensInvalidatedAt) {
          throw new UnauthorizedException({
            message:
              'Tu sesión ha sido invalidada. Por favor, inicia sesión nuevamente.',
            reason: 'SESSION_INVALIDATED',
            statusCode: 401,
          });
        }
      }
      */

      // NOTA: NO bloqueamos usuarios baneados/suspendidos aquí
      // Permitimos que pasen la autenticación JWT para que puedan:
      // 1. Recibir notificaciones WebSocket sobre su estado
      // 2. Ver el modal correspondiente en el frontend
      // 3. Cerrar sesión de forma controlada
      // El ActiveAccountGuard se encargará de bloquear acciones de creación/modificación

      // Usuarios suspendidos y baneados SÍ pueden hacer peticiones de lectura
      // El ActiveAccountGuard bloqueará creación de contenido
    } catch (error) {
      // Si es una excepción de baneo/suspensión, propagarla
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // Si el microservicio no responde, permitir acceso (degradación elegante)
      // pero loguear el error para investigación
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error verificando estado de cuenta:', error.message);
    }

    // Incluir accountStatus en el objeto user para que ActiveAccountGuard pueda validarlo
    return {
      id: payload.sub,
      email: payload.email,
      roleId: payload.roleId,
      profileId: payload.profileId,
      accountStatus: userStatus.isBanned
        ? 'banned'
        : userStatus.isSuspended
          ? 'suspended'
          : 'active',
      suspensionExpiresAt: userStatus.suspensionExpiresAt,
      banReason: userStatus.banReason,
    };
  }
}
