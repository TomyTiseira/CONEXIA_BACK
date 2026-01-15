import { SetMetadata } from '@nestjs/common';

export const ALLOW_SUSPENDED_KEY = 'allow_suspended';

/**
 * Decorator que permite acceso a usuarios suspendidos en una ruta específica
 * 
 * Usar en rutas donde los usuarios suspendidos necesiten acceder, como:
 * - Ver sus compromisos activos
 * - Completar servicios en curso
 * - Mensajería relacionada con trabajos activos
 * 
 * @example
 * ```typescript
 * @Get('my-active-hirings')
 * @AllowSuspended()
 * @UseGuards(JwtAuthGuard, NotSuspendedGuard)
 * async getMyActiveHirings(@Request() req) {
 *   return this.service.getActiveHirings(req.user.id);
 * }
 * ```
 */
export const AllowSuspended = () => SetMetadata(ALLOW_SUSPENDED_KEY, true);
