import { SetMetadata } from '@nestjs/common';

export const ALLOW_INCOMPLETE_PROFILE_KEY = 'allowIncompleteProfile';

/**
 * Permite acceder a un endpoint aunque el usuario tenga el perfil incompleto.
 * Útil para el flujo de onboarding (crear/actualizar perfil, obtener /auth/me, etc.).
 */
export const AllowIncompleteProfile = () =>
  SetMetadata(ALLOW_INCOMPLETE_PROFILE_KEY, true);
