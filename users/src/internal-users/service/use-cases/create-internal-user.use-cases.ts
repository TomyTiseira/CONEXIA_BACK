import { Injectable } from '@nestjs/common';
import { ROLES } from 'src/common/constants/roles';
import {
    InvalidRoleException,
    MissingRequiredFieldsException,
} from 'src/common/exceptions/user.exceptions';
import { UserBaseService } from 'src/common/services/user-base.service';
import { CryptoUtils } from 'src/common/utils/crypto.utils';
import { CreateInternalUserDto } from 'src/internal-users/dto/create-internal-user.dto';
import { InternalUserRepository } from 'src/internal-users/repository/internal-user.repository';
import { User } from 'src/shared/entities/user.entity';

@Injectable()
export class CreateInternalUserUseCase {
  constructor(
    private readonly userRepository: InternalUserRepository,
    private readonly userBaseService: UserBaseService,
  ) {}

  async execute(createUserDto: CreateInternalUserDto) {
    const { email, password, roleId } = createUserDto;
    if (!email || !password || !roleId) {
      throw new MissingRequiredFieldsException(['email', 'password', 'roleId']);
    }
    // Validar email único
    await this.userBaseService.validateUserDoesNotExist(email);

    // Buscar el rol por id
    const roleEntity = await this.userRepository.findRoleById(roleId);

    if (
      !roleEntity ||
      ![ROLES.ADMIN, ROLES.MODERATOR].includes(
        roleEntity.name as typeof ROLES.ADMIN | typeof ROLES.MODERATOR,
      )
    ) {
      throw new InvalidRoleException(roleId);
    }
    // Hashear la contraseña
    const hashedPassword = await CryptoUtils.hashPassword(password);
    // Crear usuario
    const user: Partial<User> = {
      email,
      password: hashedPassword,
      roleId: roleEntity.id,
      isValidate: true,
      isProfileComplete: null, // Admins y moderadores no necesitan perfil
    };
    const createdUser = await this.userRepository.create(user);
    return {
      id: createdUser.id,
      email: createdUser.email,
      roleId: createdUser.roleId,
    };
  }
}
