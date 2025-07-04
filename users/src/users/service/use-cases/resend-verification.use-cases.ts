import { Injectable } from '@nestjs/common';
import { MockEmailService } from '../../../common/services/mock-email.service';
import { UserBaseService } from '../../../common/services/user-base.service';
import { User } from '../../../shared/entities/user.entity';
import { UserRepository } from '../../repository/users.repository';

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBaseService: UserBaseService,
    private readonly emailService: MockEmailService,
  ) {}

  async execute(email: string): Promise<User> {
    // Validar que el usuario exista
    const user = await this.userBaseService.validateUserExists(email);

    // Validar que el usuario no esté activo
    this.userBaseService.validateUserNotActive(user);

    // Generar nuevos datos de verificación
    const { verificationCode, verificationCodeExpires } =
      this.userBaseService.generateVerificationData();

    // Actualizar usuario con nuevo código de verificación
    const updatedUser = await this.userRepository.update(user.id, {
      verificationCode,
      verificationCodeExpires,
    });

    // Validar que la actualización fue exitosa
    const validatedUser =
      this.userBaseService.validateVerificationCodeUpdate(updatedUser);

    // Enviar email con nuevo código de verificación
    await this.emailService.sendVerificationEmail(
      validatedUser.email,
      validatedUser.verificationCode,
    );

    return validatedUser;
  }
}
