import { applyDecorators, UseGuards } from '@nestjs/common';
import { AutoRefreshJwtGuard } from '../guards/auto-refresh-jwt.guard';
import { ProfileCompleteGuard } from '../guards/profile-complete.guard';

/**
 * Decorador que aplica el AutoRefreshJwtGuard
 * Este guard verifica automáticamente el access_token y hace refresh si es necesario
 *
 * @example
 * @AutoRefreshAuth()
 * @Get('protected-route')
 * getProtectedData() {
 *   return 'This route is protected with auto-refresh';
 * }
 */
export const AutoRefreshAuth = () =>
  applyDecorators(UseGuards(AutoRefreshJwtGuard, ProfileCompleteGuard));
