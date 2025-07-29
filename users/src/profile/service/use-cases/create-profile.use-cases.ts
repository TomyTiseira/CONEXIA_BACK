import { Injectable } from '@nestjs/common';
import { UserBaseService } from 'src/common/services/user-base.service';
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
    private readonly userBaseService: UserBaseService,
  ) {}

  async execute(dto: CreateProfileDto) {
    await this.userBaseService.existsProfileByDocumentNumber(
      dto.documentTypeId,
      dto.documentNumber,
    );

    // Validar ≥18 años
    const birth = dto.birthDate ? new Date(dto.birthDate) : undefined;
    if (birth) {
      const age = new Date().getFullYear() - birth.getFullYear();
      if (age < 18) {
        throw new UserBadRequestException('must be at least 18 years old');
      }
    }

    // Validar que cuando isCurrent sea true, endDate debe estar vacío
    if (dto.experience && dto.experience.length > 0) {
      for (let i = 0; i < dto.experience.length; i++) {
        const exp = dto.experience[i];
        if (exp.isCurrent && exp.endDate) {
          throw new UserBadRequestException(
            `Experience item ${i + 1}: endDate must be empty when isCurrent is true`,
          );
        }
      }
    }

    const userId = dto.userId;
    // Confirmar existencia de usuario
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundByIdException(userId);

    const profile = await this.profileRepo.findByUserId(userId);
    console.log(profile);

    // Extraer datos del perfil del DTO (excluyendo el token)
    const profileData = {
      name: dto.name,
      lastName: dto.lastName,
      documentNumber: dto.documentNumber,
      documentTypeId: dto.documentTypeId,
      phoneNumber: dto.phoneNumber,
      country: dto.country,
      state: dto.state,
      birthDate: dto.birthDate,
      profilePicture: dto.profilePicture,
      coverPicture: dto.coverPicture,
      skills: dto.skills,
      description: dto.description,
      experience: dto.experience,
      socialLinks: dto.socialLinks,
    };

    if (profile) {
      // Si ya tiene el número de documento, no se puede actualizar
      if (profile.documentNumber) {
        throw new UserBadRequestException(
          'documentNumber already exists, you cannot update it',
        );
      }
      const updatedProfile = await this.profileRepo.update(profile.id, {
        ...profileData,
        birthDate: birth,
      });

      // Obtener el usuario completo actualizado con todas sus relaciones
      const updatedUser = await this.userRepo.findByIdWithRelations(userId);

      if (!updatedProfile) {
        throw new UserBadRequestException('Failed to update profile');
      }

      if (!updatedUser) {
        throw new UserNotFoundByIdException(userId);
      }

      return {
        success: true,
        message: 'Perfil actualizado exitosamente',
        profile: updatedProfile,
      };
    }

    // Crear perfil (ignore campos nullables omitidos)
    const newProfile = await this.profileRepo.create({
      ...profileData,
      userId,
      birthDate: birth,
    });

    // Actualizar el usuario con el id del perfil
    await this.userRepo.update(userId, {
      profileId: newProfile.id,
    });

    return {
      success: true,
      message: 'Perfil creado exitosamente',
      profile: newProfile,
    };
  }
}
