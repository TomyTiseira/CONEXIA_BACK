import { Injectable } from '@nestjs/common';
import { EmailService } from 'src/common/services/email.service';
import { UserBaseService } from 'src/common/services/user-base.service';
import { UserRepository } from 'src/users/repository/users.repository';
import { UpdateUserDto } from '../../dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBaseService: UserBaseService,
    private readonly emailService: EmailService,
  ) {}

  async execute(id: number, updateUserDto: UpdateUserDto) {
    // Validar que el usuario exista
    const user = await this.userBaseService.validateUserExistsById(id);

    // Validar que el usuario esté activo
    this.userBaseService.validateUserActive(user);

    // Validar que la contraseña no sea la misma que la actual
    await this.userBaseService.validateNewPasswordNotSameAsCurrent(
      user,
      updateUserDto.password,
    );

    // Preparar los datos para actualizar el usuario
    const userToUpdate =
      await this.userBaseService.prepareUserForUpdatePassword(
        user,
        updateUserDto.password,
      );

    // Actualizar el usuario
    const updatedUser = await this.userRepository.update(user.id, userToUpdate);

    // Enviar email de confirmación de cambio de contraseña
    await this.emailService.sendPasswordChangedEmail(user.email);

    return updatedUser;
  }
}
