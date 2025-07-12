/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envs } from '../../config';

export interface JwtPayload {
  sub: number;
  email: string;
  roleId: number;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
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

  validate(payload: JwtPayload) {
    // Verificar que sea un access token
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return {
      id: payload.sub,
      email: payload.email,
      roleId: payload.roleId,
    };
  }
}
