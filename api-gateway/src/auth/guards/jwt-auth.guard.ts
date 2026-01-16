import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Sobrescribimos handleRequest para preservar ForbiddenException
   * Por defecto, Passport convierte todas las excepciones en UnauthorizedException
   */
  handleRequest(err: any, user: any, info: any) {
    // Si hay un error y es ForbiddenException (baneo/suspensión), propagarlo tal cual
    if (err instanceof ForbiddenException) {
      throw err;
    }

    // Para cualquier otro error o usuario inválido, usar el comportamiento por defecto
    if (err || !user) {
      throw err || new UnauthorizedException(info?.message || 'No autorizado');
    }

    return user;
  }
}
