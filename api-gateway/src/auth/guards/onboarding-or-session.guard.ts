import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AutoRefreshJwtGuard } from './auto-refresh-jwt.guard';
import { OnboardingJwtGuard } from './onboarding-jwt.guard';

/**
 * Permite autenticación por onboarding_token (flujo recomendado)
 * o por sesión normal (fallback si el onboarding_token expiró y el usuario inició sesión).
 */
@Injectable()
export class OnboardingOrSessionGuard implements CanActivate {
  constructor(
    private readonly onboardingGuard: OnboardingJwtGuard,
    private readonly sessionGuard: AutoRefreshJwtGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const req: any = context.switchToHttp().getRequest();
    const hasOnboardingCookie = Boolean(
      req?.cookies?.onboarding_token ||
        (typeof req?.headers?.cookie === 'string' &&
          req.headers.cookie.includes('onboarding_token=')),
    );

    // Si el onboarding_token existe, NO enmascarar errores cayendo a sesión.
    // (Si está expirado/invalid, queremos ver ese error y no el de sesión.)
    if (hasOnboardingCookie) {
      return (await this.onboardingGuard.canActivate(context)) as boolean;
    }

    return await this.sessionGuard.canActivate(context);
  }
}
