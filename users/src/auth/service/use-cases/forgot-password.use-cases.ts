import { Injectable } from '@nestjs/common';
import { MockEmailService } from '../../../common/services/mock-email.service';
import { UserBaseService } from '../../../common/services/user-base.service';
import { UserRepository } from '../../../users/repository/users.repository';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBaseService: UserBaseService,
    private readonly emailService: MockEmailService,
  ) {}

  async execute(email: string): Promise<void> {
    // Validar que el usuario exista
    const user = await this.userBaseService.validateUserExists(email);

    // Validar que el usuario esté activo
    this.userBaseService.validateUserActive(user);

    // Preparar datos para resetear la contraseña
    const userToUpdate = this.userBaseService.prepareUserForPasswordReset(user);

    // Actualizar usuario con el código de reseteo de contraseña
    await this.userRepository.update(user.id, {
      passwordResetCode: userToUpdate.passwordResetCode,
      passwordResetCodeExpires: userToUpdate.passwordResetCodeExpires,
    });

    // Enviar email con el código de reseteo de contraseña
    await this.emailService.sendPasswordResetEmail(
      user.email,
      userToUpdate.passwordResetCode,
    );
  }
}
