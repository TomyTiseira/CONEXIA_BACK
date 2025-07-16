/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_NAME_TO_ID } from '../constants/role-ids';

export interface RoleGuardOptions {
  roles?: string[];
  requireAll?: boolean;
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RoleGuardOptions>(
      'roles',
      context.getHandler(),
    );

    if (!options || !options.roles || options.roles.length === 0) {
      return true; // Si no hay roles especificados, permitir acceso
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException(
        'user not authenticated or no role assigned',
      );
    }

    const userRoleId = user.roleId;
    const requiredRoleIds = options.roles.map(
      (roleName) => ROLE_NAME_TO_ID[roleName],
    );

    if (requiredRoleIds.length === 0) {
      throw new ForbiddenException('invalid roles specified');
    }

    if (options.requireAll) {
      // Requiere que el usuario tenga TODOS los roles especificados
      const hasAllRoles = requiredRoleIds.every(
        (roleId) => roleId === userRoleId,
      );
      if (!hasAllRoles) {
        throw new ForbiddenException(
          `access denied. all roles are required: ${options.roles.join(', ')}`,
        );
      }
    } else {
      // Requiere que el usuario tenga AL MENOS UNO de los roles especificados
      const hasAnyRole = requiredRoleIds.includes(userRoleId);
      if (!hasAnyRole) {
        throw new ForbiddenException(
          `access denied. at least one of the roles is required: ${options.roles.join(', ')}`,
        );
      }
    }

    return true;
  }
}
