import { Injectable } from '@nestjs/common';
import { Users } from 'src/users/entities/users.entity';
import { MockEmailService } from '../../../common/services/mock-email.service';
import { UserBaseService } from '../../../common/services/user-base.service';
import { UserRepository } from '../../repository/users.repository';

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBaseService: UserBaseService,
    private readonly emailService: MockEmailService,
  ) {}

  async execute(email: string): Promise<Users> {
    // Buscar y validar que el usuario exista
    const user = await this.userBaseService.validateUserExists(email);

    // Validar que no esté activo
    this.userBaseService.validateUserNotActive(user);

    // Generar nuevos datos de verificación
    const verificationData = this.userBaseService.generateVerificationData();

    // Actualizar usuario con nuevo código
    const updatedUser = await this.userRepository.update(
      user.id,
      verificationData,
    );

    // Validar que la actualización fue exitosa
    const validatedUser =
      this.userBaseService.validateVerificationCodeUpdate(updatedUser);

    // Enviar email con nuevo código de verificación
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationData.verificationCode,
    );

    return validatedUser;
  }
}
