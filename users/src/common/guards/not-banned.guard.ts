import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountStatus, User } from 'src/shared/entities/user.entity';
import { Repository } from 'typeorm';

/**
 * Guard que verifica que el usuario no esté baneado
 */
@Injectable()
export class NotBannedGuard implements CanActivate {
  private readonly logger = new Logger(NotBannedGuard.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id?: number; sub?: number } }>();
    const userId = request.user?.id || request.user?.sub;

    if (!userId) {
      // Si no hay userId, dejamos que otros guards manejen la autenticación
      return true;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'accountStatus', 'bannedAt', 'banReason'],
    });

    if (!user) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    if (user.accountStatus === AccountStatus.BANNED) {
      this.logger.warn(
        `Usuario ${userId} intentó acceder estando baneado. Motivo: ${user.banReason}`,
      );
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message:
          'Tu cuenta ha sido baneada permanentemente. Contacta a soporte@conexia.com para más información.',
        banned: true,
        bannedAt: user.bannedAt,
        reason: user.banReason,
      });
    }

    return true;
  }
}
