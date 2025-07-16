import { SetMetadata } from '@nestjs/common';
import { RoleGuardOptions } from '../guards/role.guard';

/**
 * Decorador para especificar roles requeridos en un endpoint
 *
 * @param roles - Array de nombres de roles requeridos
 * @param requireAll - Si es true, requiere que el usuario tenga TODOS los roles especificados
 *                    Si es false (por defecto), requiere que tenga AL MENOS UNO
 *
 * @example
 * // Requiere rol de admin
 * @Roles(['admin'])
 * @Get('admin-only')
 * adminOnly() { ... }
 *
 * // Requiere rol de admin O moderador
 * @Roles(['admin', 'moderador'])
 * @Get('admin-or-moderator')
 * adminOrModerator() { ... }
 *
 * // Requiere rol de admin Y moderador (imposible, pero ejemplo)
 * @Roles(['admin', 'moderador'], true)
 * @Get('admin-and-moderator')
 * adminAndModerator() { ... }
 */
export const Roles = (roles: string[], requireAll: boolean = false) =>
  SetMetadata<keyof RoleGuardOptions, RoleGuardOptions>('roles', {
    roles,
    requireAll,
  });
