import { SetMetadata } from '@nestjs/common';

export const ALLOW_SUSPENDED_KEY = 'allow_suspended';

/**
 * Decorator que permite acceso a usuarios suspendidos en una ruta específica
 *
 * Usar en rutas donde los usuarios suspendidos necesiten acceder, como:
 * - Ver sus compromisos activos (servicios contratados en curso)
 * - Completar entregas de servicios
 * - Comunicarse con clientes/colaboradores actuales
 * - Ver y gestionar proyectos existentes como owner
 *
 * @example
 * ```typescript
 * @Get('my-active-hirings')
 * @AllowSuspended()
 * @AuthRoles([ROLES.USER])
 * async getMyActiveHirings(@User() user: AuthenticatedUser) {
 *   return this.service.getActiveHirings(user.id);
 * }
 * ```
 */
export const AllowSuspended = () => SetMetadata(ALLOW_SUSPENDED_KEY, true);
