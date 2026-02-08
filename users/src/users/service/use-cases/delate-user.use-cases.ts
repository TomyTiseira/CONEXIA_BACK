import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ProfileNotFoundException,
  UserAlreadyDeletedException,
  UserHasActiveHiringsException,
  UserNotAllowedToDeleteException,
  UserNotFoundByIdException,
} from 'src/common/exceptions/user.exceptions';
import { User } from 'src/shared/entities/user.entity';
import { ROLES } from 'src/users/constants/roles';
import { UserRepository } from 'src/users/repository/users.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  async execute(userId: number, reason: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundByIdException(userId);
    }

    // validar que el usuario no esté eliminado
    if (user.deletedAt) {
      throw new UserAlreadyDeletedException(userId);
    }

    // validar que el usuario no sea admin o moderador (solo user)
    const userRole = await this.userRepository.findRoleByUserId(userId);
    if (!userRole) {
      throw new UserNotFoundByIdException(userId);
    }
    if (userRole.name !== ROLES.USER) {
      throw new UserNotAllowedToDeleteException(userId);
    }

    // Obtener el perfil del usuario
    const userProfile = await this.userRepository.findProfileByUserId(userId);
    if (!userProfile) {
      throw new ProfileNotFoundException();
    }

    // Validar que el usuario no tenga contrataciones en curso
    try {
      const activeHiringsResponse: {
        hasActiveHirings: boolean;
        count: number;
      } = await firstValueFrom(
        this.natsClient.send('checkUserActiveHirings', { userId }),
      );

      if (activeHiringsResponse?.hasActiveHirings) {
        throw new UserHasActiveHiringsException(
          userId,
          activeHiringsResponse.count,
        );
      }
    } catch (error) {
      // Si es nuestra excepción personalizada, re-lanzarla
      if (error instanceof UserHasActiveHiringsException) {
        throw error;
      }
      // Si hay un error de comunicación con el microservicio, NO permitir la eliminación
      console.error('Error checking active hirings:', error);
      throw new Error(
        'Unable to verify active service hirings. User deletion cancelled for safety.',
      );
    }

    // Eliminar el usuario y el perfil, asegurando que ambos se eliminen
    await this.userRepository.deleteUser(user, reason);
    await this.userRepository.deleteProfile(userProfile);

    return user;
  }
}
