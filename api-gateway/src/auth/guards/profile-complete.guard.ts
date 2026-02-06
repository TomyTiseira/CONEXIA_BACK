import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_INCOMPLETE_PROFILE_KEY } from '../decorators/allow-incomplete-profile.decorator';

@Injectable()
export class ProfileCompleteGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowIncomplete = this.reflector.getAllAndOverride<boolean>(
      ALLOW_INCOMPLETE_PROFILE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowIncomplete) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: any }>();
    const user = request.user as
      | {
          id: number;
          email: string;
          roleId: number;
          isProfileComplete?: boolean | null;
        }
      | undefined;

    // Si no hay user, dejamos que los guards de auth manejen la situación.
    if (!user) {
      return true;
    }

    // Admin/moderador usan null como “no aplica”. Se considera permitido.
    if (user.isProfileComplete === true || user.isProfileComplete === null) {
      return true;
    }

    throw new ForbiddenException({
      statusCode: 403,
      error: 'Forbidden',
      code: 'PROFILE_INCOMPLETE',
      message:
        'Debes completar tu perfil para acceder a las funcionalidades de la plataforma.',
    });
  }
}
