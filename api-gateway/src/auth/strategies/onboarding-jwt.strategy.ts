import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envs } from '../../config';

interface OnboardingJwtPayload {
  sub: number;
  email: string;
  roleId: number;
  profileId: number;
  isProfileComplete: boolean | null;
  type: 'onboarding';
}

@Injectable()
export class OnboardingJwtStrategy extends PassportStrategy(
  Strategy,
  'onboarding-jwt',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: {
          cookies?: { onboarding_token?: string };
          headers?: { cookie?: string };
        }) => {
          const fromParsedCookies = request?.cookies?.onboarding_token;
          if (fromParsedCookies) return fromParsedCookies;

          const rawCookie: string | undefined = request?.headers?.cookie;
          if (!rawCookie) return null;

          const match = rawCookie.match(/(?:^|;\s*)onboarding_token=([^;]+)/);
          return match?.[1] ? decodeURIComponent(match[1]) : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: envs.jwtSecret,
    });
  }

  validate(payload: OnboardingJwtPayload) {
    if (payload.type !== 'onboarding') {
      throw new UnauthorizedException('Invalid token type');
    }

    return {
      id: payload.sub,
      email: payload.email,
      roleId: payload.roleId,
      profileId: payload.profileId,
      isProfileComplete: payload.isProfileComplete,
    };
  }
}
