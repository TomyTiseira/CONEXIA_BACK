import { BadRequestException, Injectable } from '@nestjs/common';
import { UserNotFoundByIdException } from '../../../common/exceptions/user.exceptions';
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
        throw new BadRequestException('Debe tener al menos 18 años');
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
    return this.profileRepo.create({
      ...dto,
      birthDate: birth,
    });
  }
}
