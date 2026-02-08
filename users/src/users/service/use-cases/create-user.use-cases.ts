import { Injectable } from '@nestjs/common';
import { MockEmailService } from '../../../common/services/mock-email.service';
import { UserBaseService } from '../../../common/services/user-base.service';
import { User } from '../../../shared/entities/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UserRepository } from '../../repository/users.repository';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBaseService: UserBaseService,
    private readonly emailService: MockEmailService,
  ) {}

  async execute(userData: CreateUserDto): Promise<User> {
    // Validar que el usuario no exista
    await this.userBaseService.validateUserDoesNotExistWithDeleted(
      userData.email,
    );

    // Preparar datos del usuario para creación
    const userToCreate =
      await this.userBaseService.prepareUserForCreation(userData);

    // Crear usuario
    const user = await this.userRepository.create(userToCreate);

    // Enviar email con código de verificación
    await this.emailService.sendVerificationEmail(
      user.email,
      user.verificationCode,
    );

    return user;
  }
}
