import { applyDecorators, UseGuards } from '@nestjs/common';
import { ActiveAccountGuard } from '../guards/active-account.guard';
import { AutoRefreshJwtGuard } from '../guards/auto-refresh-jwt.guard';
import { ProfileCompleteGuard } from '../guards/profile-complete.guard';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from './roles.decorator';

/**
 * Decorator combinado que aplica autenticación JWT, validación de roles y cuenta activa
 *
 * Este decorator reemplaza @AuthRoles para endpoints que requieren cuenta activa.
 * Aplica los guards en el orden correcto:
 * 1. AutoRefreshJwtGuard - Valida JWT y popula request.user
 * 2. RoleGuard - Valida que el usuario tenga el rol correcto
 * 3. ActiveAccountGuard - Valida que accountStatus = 'active'
 *
 * Usar en endpoints donde el usuario debe crear nuevo contenido:
 * - Crear servicios
 * - Publicar proyectos
 * - Postularse a proyectos
 * - Solicitar cotizaciones
 * - Aceptar contrataciones
 * - Crear posts en comunidades
 *
 * @param roles - Array de IDs de roles permitidos (ej: [ROLES.USER])
 * @param requireAll - Si es true, requiere que el usuario tenga TODOS los roles especificados
 *
 * @example
 * ```typescript
 * @Post()
 * @RequiresActiveAccount([ROLES.USER]) // ⭐ Reemplaza @AuthRoles + ActiveAccountGuard
 * async createService(@Body() dto: CreateServiceDto, @User() user: AuthenticatedUser) {
 *   return this.client.send('createService', { dto, userId: user.id });
 * }
 * ```
 */
export function RequiresActiveAccount(
  roles: string[] = [],
  requireAll: boolean = false,
) {
  return applyDecorators(
    Roles(roles, requireAll),
    UseGuards(
      AutoRefreshJwtGuard,
      RoleGuard,
      ProfileCompleteGuard,
      ActiveAccountGuard,
    ),
  );
}
