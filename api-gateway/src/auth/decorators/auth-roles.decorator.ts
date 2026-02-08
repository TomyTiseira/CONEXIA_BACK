import { applyDecorators, UseGuards } from '@nestjs/common';
import { AutoRefreshJwtGuard } from '../guards/auto-refresh-jwt.guard';
import { ProfileCompleteGuard } from '../guards/profile-complete.guard';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from './roles.decorator';

/**
 * Decorador combinado que aplica autenticación JWT y validación de roles
 *
 * @param roles - Array de nombres de roles requeridos
 * @param requireAll - Si es true, requiere que el usuario tenga TODOS los roles especificados
 *                    Si es false (por defecto), requiere que tenga AL MENOS UNO
 *
 * @example
 * // Endpoint que requiere autenticación y rol de admin
 * @AuthRoles(['admin'])
 * @Get('admin-only')
 * adminOnly() { ... }
 *
 * // Endpoint que requiere autenticación y rol de admin O moderador
 * @AuthRoles(['admin', 'moderador'])
 * @Get('admin-or-moderator')
 * adminOrModerator() { ... }
 */
export const AuthRoles = (roles: string[], requireAll: boolean = false) =>
  applyDecorators(
    Roles(roles, requireAll),
    UseGuards(AutoRefreshJwtGuard, RoleGuard, ProfileCompleteGuard),
  );
