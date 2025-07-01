import { Injectable } from '@nestjs/common';
import { Users } from 'src/users/entities/users.entity';
import { UserBaseService } from '../../../common/services/user-base.service';
import { UserRepository } from '../../repository/users.repository';

@Injectable()
export class VerifyUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBaseService: UserBaseService,
  ) {}

  async execute(email: string, verificationCode: string): Promise<Users> {
    // Buscar y validar que el usuario exista
    const user = await this.userBaseService.validateUserExists(email);

    // Validar que no esté activo
    this.userBaseService.validateUserNotActive(user);

    // Validar código de verificación
    this.userBaseService.validateVerificationCode(user, verificationCode);

    // Validar que el código no haya expirado
    this.userBaseService.validateVerificationCodeNotExpired(user);

    // Preparar datos para activación
    const activationData = this.userBaseService.prepareUserForActivation();

    // Activar usuario
    const updatedUser = await this.userRepository.update(user.id, {
      isValidate: activationData.isValidate,
      verificationCode: activationData.verificationCode || undefined,
      verificationCodeExpires:
        activationData.verificationCodeExpires || undefined,
    });

    // Validar que la activación fue exitosa
    return this.userBaseService.validateUserActivation(updatedUser);
  }
}
