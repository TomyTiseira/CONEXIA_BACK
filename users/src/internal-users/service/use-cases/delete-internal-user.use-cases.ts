import { Injectable } from '@nestjs/common';
import { ROLES } from 'src/common/constants/roles';
import {
  RoleIdNotFoundException,
  UserAlreadyDeletedException,
  UserNotAdminOrModeratorException,
  UserNotAllowedToDeleteException,
  UserNotFoundByIdException,
} from 'src/common/exceptions/user.exceptions';
import { InternalUserRepository } from '../../repository/internal-user.repository';

@Injectable()
export class DeleteInternalUserUseCase {
  constructor(
    private readonly internalUserRepository: InternalUserRepository,
  ) {}

  async execute(id: number, userId: number) {
    const user = await this.internalUserRepository.findById(id);
    if (!user) {
      throw new UserNotFoundByIdException(id);
    }

    // Validar que el usuario no esté eliminado
    if (user.deletedAt) {
      throw new UserAlreadyDeletedException(id);
    }

    // Validar que el usuario que está eliminado no sea el mismo que esta eliminando
    if (user.id === userId) {
      throw new UserNotAllowedToDeleteException(id);
    }

    // Validar que el usuario tenga rol admin o moderador
    const userRole = await this.internalUserRepository.findRoleById(
      user.roleId,
    );

    if (!userRole) {
      throw new RoleIdNotFoundException(user.roleId);
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
