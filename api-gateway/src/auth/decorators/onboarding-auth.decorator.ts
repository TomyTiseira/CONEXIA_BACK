import { applyDecorators, UseGuards } from '@nestjs/common';
import { OnboardingJwtGuard } from '../guards/onboarding-jwt.guard';

/**
 * Protege endpoints del flujo de onboarding.
 * Usa la cookie HttpOnly `onboarding_token` (NO access/refresh).
 */
export const OnboardingAuth = () =>
  applyDecorators(UseGuards(OnboardingJwtGuard));
