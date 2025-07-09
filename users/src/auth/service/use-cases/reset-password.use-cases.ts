import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserBaseService } from '../../../common/services/user-base.service';
import { UserRepository } from '../../../users/repository/users.repository';
import { ResetPasswordDto } from '../../dto/reset-password.dto';
import { TokenService } from '../token.service';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly userBaseService: UserBaseService,
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(resetPasswordDto: ResetPasswordDto) {
    // Validar que el usuario exista
    const user = await this.userBaseService.validateUserExists(
      resetPasswordDto.email,
    );

    // Validar que el usuario esté activo
    this.userBaseService.validateUserActive(user);

    // Validar el token de reset de contraseña
    try {
      const payload = this.tokenService.verifyToken(
        resetPasswordDto.resetToken,
      );

      // Verificar que el token corresponda al usuario
      if (payload.sub !== user.id || payload.email !== user.email) {
        throw new UnauthorizedException('Invalid reset token for this user');
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Preparar datos del usuario para actualización
    const userToUpdate =
      await this.userBaseService.prepareUserForUpdatePassword(
        user,
        resetPasswordDto.password,
      );

    // Actualizar contraseña del usuario
    return this.userRepository.update(user.id, userToUpdate);
  }
}
