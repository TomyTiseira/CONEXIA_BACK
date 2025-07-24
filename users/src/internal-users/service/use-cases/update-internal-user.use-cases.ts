import { Injectable } from '@nestjs/common';
import {
  RoleIdNotFoundException,
  RoleModificationException,
  RoleNotAdminOrModeratorException,
  UserNotAdminOrModeratorException,
  UserNotAllowedToUpdateException,
  UserNotFoundByIdException,
} from 'src/common/exceptions/user.exceptions';
import { UserBaseService } from 'src/common/services/user-base.service';
import { UpdateInternalUserDto } from 'src/internal-users/dto/update-internal-user.dto';
import { InternalUserRepository } from 'src/internal-users/repository/internal-user.repository';
import { ROLES } from 'src/users/constants/roles';

@Injectable()
export class UpdateInternalUserUseCase {
  constructor(
    private readonly userBaseService: UserBaseService,
    private readonly internalUsersRepository: InternalUserRepository,
  ) {}

  async execute(userId: number, updateUserDto: UpdateInternalUserDto) {
    // Validar que el usuario no se actualice a sí mismo
    if (updateUserDto.authenticatedUserId === userId) {
      throw new UserNotAllowedToUpdateException(userId);
    }

    // Validar que el usuario exista
    const user = await this.internalUsersRepository.findByIdWithRole(userId);
    if (!user) {
      throw new UserNotFoundByIdException(userId);
    }

    // Validar que el rol del usuario sea admin o moderator
    if (user.role.name !== ROLES.ADMIN && user.role.name !== ROLES.MODERATOR) {
      throw new UserNotAdminOrModeratorException(userId);
    }

    // Validar que la contraseña no sea la misma que la actual
    await this.userBaseService.validateNewPasswordNotSameAsCurrent(
      user,
      updateUserDto.password,
    );

    let userToUpdate = { ...user };

    // Actualizar contraseña si se proporciona
    if (updateUserDto.password) {
      userToUpdate = await this.userBaseService.prepareUserForUpdatePassword(
        userToUpdate,
        updateUserDto.password,
      );
    }

    // Validar y actualizar rol si se proporciona
    if (updateUserDto.roleId) {
      const newRole = await this.internalUsersRepository.findRoleById(
        updateUserDto.roleId,
      );
      if (!newRole) {
        throw new RoleIdNotFoundException(updateUserDto.roleId);
      }

      // Validar que el rol sea admin o moderator
      if (newRole.name !== ROLES.ADMIN && newRole.name !== ROLES.MODERATOR) {
        throw new RoleNotAdminOrModeratorException(newRole.id);
      }

      // Obtener el rol actual del usuario
      const currentRole = await this.internalUsersRepository.findRoleById(
        user.roleId,
      );
      if (!currentRole) {
        throw new RoleIdNotFoundException(user.roleId);
      }

      // Validar que el rol no se modifique de manera descendente (admin -> moderator)
      if (
        newRole.name === ROLES.MODERATOR &&
        currentRole.name === ROLES.ADMIN
      ) {
        throw new RoleModificationException(updateUserDto.roleId);
      }

      // Actualizar el roleId en el objeto userToUpdate
      userToUpdate.roleId = updateUserDto.roleId;
    }

    const userUpdated = await this.internalUsersRepository.update(
      userId,
      userToUpdate,
    );

    return {
      id: userUpdated.id,
      email: userUpdated.email,
      roleId: userUpdated.roleId,
      roleName: userUpdated.role.name,
    };
  }
}
