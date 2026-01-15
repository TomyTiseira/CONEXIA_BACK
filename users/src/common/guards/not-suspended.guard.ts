import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountStatus, User } from 'src/shared/entities/user.entity';
import { Repository } from 'typeorm';

/**
 * Metadata key para marcar rutas que permiten acceso a usuarios suspendidos
 * Usar con decorator: @AllowSuspended()
 */
export const ALLOW_SUSPENDED_KEY = 'allow_suspended';

/**
 * Guard que verifica que el usuario no esté suspendido
 * EXCEPTO en rutas marcadas con @AllowSuspended() decorator
 */
@Injectable()
export class NotSuspendedGuard implements CanActivate {
  private readonly logger = new Logger(NotSuspendedGuard.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si la ruta permite acceso a usuarios suspendidos
    const allowSuspended = this.reflector.getAllAndOverride<boolean>(
      ALLOW_SUSPENDED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowSuspended) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.user?.sub;

    if (!userId) {
      // Si no hay userId, dejamos que otros guards manejen la autenticación
      return true;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'accountStatus',
        'suspendedAt',
        'suspensionExpiresAt',
        'suspensionReason',
        'suspensionDays',
      ],
    });

    if (!user) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      const now = new Date();
      const daysRemaining = user.suspensionExpiresAt
        ? Math.ceil(
            (user.suspensionExpiresAt.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      this.logger.warn(
        `Usuario ${userId} intentó acceder estando suspendido. Expira en ${daysRemaining} días.`,
      );

      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: `Tu cuenta está suspendida temporalmente. Podrás acceder nuevamente el ${user.suspensionExpiresAt?.toLocaleDateString('es-ES')}.`,
        suspended: true,
        suspendedAt: user.suspendedAt,
        suspensionExpiresAt: user.suspensionExpiresAt,
        daysRemaining,
        reason: user.suspensionReason,
      });
    }

    return true;
  }
}
