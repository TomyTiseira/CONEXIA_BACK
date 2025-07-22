import { Injectable } from '@nestjs/common';
import { ROLES } from 'src/common/constants/roles';
import {
  UserAlreadyDeletedException,
  UserNotFoundByIdException,
} from 'src/common/exceptions/user.exceptions';
import { InternalUserRepository } from '../../repository/internal-user.repository';

@Injectable()
export class DeleteInternalUserUseCases {
  constructor(
    private readonly internalUserRepository: InternalUserRepository,
  ) {}

  async execute(id: number) {
    const user = await this.internalUserRepository.findById(id);
    if (!user) {
      throw new UserNotFoundByIdException(id);
    }

    if (user.deletedAt) {
      throw new UserAlreadyDeletedException(id);
    }

    // Validar que el usuario tenga rol admin o moderador
    const userRole = await this.internalUserRepository.findRoleById(
      user.roleId,
    );

    if (!userRole) {
      throw new UserNotFoundByIdException(id);
    }

    if (userRole.name !== ROLES.ADMIN && userRole.name !== ROLES.MODERATOR) {
      throw new UserNotAdminOrModeratorException(id);
    }

    await this.internalUserRepository.deleteInternalUser(id);

    return {
      message: 'User deleted successfully',
    };
  }
}
