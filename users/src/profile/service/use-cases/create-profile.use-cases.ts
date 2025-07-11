import { Injectable } from '@nestjs/common';
import {
  UserBadRequestException,
  UserNotFoundByIdException,
} from '../../../common/exceptions/user.exceptions';
import { UserRepository } from '../../../users/repository/users.repository';
import { CreateProfileDto } from '../../dto/create-profile.dto';
import { ProfileRepository } from '../../repository/profile.repository';

@Injectable()
export class CreateProfileUseCase {
  constructor(
    private readonly profileRepo: ProfileRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(dto: CreateProfileDto) {
    // Validar ≥18 años
    const birth = dto.birthDate ? new Date(dto.birthDate) : undefined;
    if (birth) {
      const age = new Date().getFullYear() - birth.getFullYear();
      if (age < 18) {
        throw new UserBadRequestException('must be at least 18 years old');
      }
    }

    // Confirmar existencia de usuario
    const user = await this.userRepo.findById(dto.userId);
    if (!user) throw new UserNotFoundByIdException(dto.userId);

    const profile = await this.profileRepo.findByUserId(dto.userId);

    if (profile) {
      // Si existe, actualizar el perfil
      return this.profileRepo.update(profile.id, {
        ...dto,
        birthDate: birth,
      });
    }

    // Crear perfil (ignore campos nullables omitidos)
    const newProfile = await this.profileRepo.create({
      ...dto,
      birthDate: birth,
    });

    // Actualizar el usuario con el id del perfil
    await this.userRepo.update(dto.userId, {
      profileId: newProfile.id,
    });

    return newProfile;
  }
}
