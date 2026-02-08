import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_SUSPENDED_KEY } from '../decorators/allow-suspended.decorator';

/**
 * Guard que verifica que el usuario tenga accountStatus = 'active'
 * Previene que usuarios suspendidos o baneados creen nuevo contenido
 *
 * Uso automático con @RequiresActiveAccount() decorator
 * O manual con @UseGuards(ActiveAccountGuard)
 */
@Injectable()
export class ActiveAccountGuard implements CanActivate {
  private readonly logger = new Logger(ActiveAccountGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si la ruta permite usuarios suspendidos (decorator @AllowSuspended)
    const allowSuspended = this.reflector.getAllAndOverride<boolean>(
      ALLOW_SUSPENDED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowSuspended) {
      this.logger.debug('Ruta permite usuarios suspendidos - skip validación');
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: any }>();
    const user = request.user as
      | {
          id: number;
          email: string;
          accountStatus: string;
          suspensionExpiresAt?: string;
          banReason?: string;
        }
      | undefined;

    if (!user) {
      // Si no hay usuario, dejar que JwtAuthGuard maneje la autenticación
      this.logger.warn('No hay usuario en request - skip validación');
      return true;
    }

    const accountStatus = user.accountStatus;
    const suspensionExpiresAt = user.suspensionExpiresAt;
    const banReason = user.banReason;

    // Validar usuario BANEADO
    if (accountStatus === 'banned') {
      this.logger.warn(
        `Usuario ${user.id} (${user.email}) intentó acceder estando BANEADO. Motivo: ${banReason}`,
      );

      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message:
          'Tu cuenta ha sido suspendida permanentemente. Contacta a soporte@conexia.com para más información.',
        banned: true,
        reason: banReason,
      });
    }

    // Validar usuario SUSPENDIDO
    if (accountStatus === 'suspended') {
      const now = new Date();

      // Parsear y validar fecha de expiración
      let expiresAt: Date | null = null;
      if (suspensionExpiresAt) {
        const parsedDate = new Date(suspensionExpiresAt);
        // Verificar que sea una fecha válida
        if (!isNaN(parsedDate.getTime())) {
          expiresAt = parsedDate;
        }
      }

      const daysRemaining = expiresAt
        ? Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          )
        : 0;

      this.logger.warn(
        `Usuario ${user.id} (${user.email}) intentó crear contenido estando SUSPENDIDO. Expira en ${daysRemaining} días.`,
      );

      const formattedDate = expiresAt
        ? expiresAt.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : 'una fecha no especificada';

      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: `Tu cuenta está suspendida temporalmente hasta el ${formattedDate}. Durante este período no puedes crear nuevo contenido.`,
        suspended: true,
        suspensionExpiresAt: expiresAt?.toISOString() || null,
        daysRemaining,
      });
    }

    // Solo usuarios con accountStatus = 'active' pasan
    this.logger.debug(
      `Usuario ${user.id} (${user.email}) tiene cuenta ACTIVA - permitir acceso`,
    );
    return true;
  }
}
