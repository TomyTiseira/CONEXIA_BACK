import { Injectable } from '@nestjs/common';
import { UserBaseService } from 'src/common/services/user-base.service';
import {
  UserBadRequestException,
  UserNotFoundByIdException,
} from '../../../common/exceptions/user.exceptions';
import { ProfileSkillRepository } from '../../../shared/repository/profile-skill.repository';
import { SkillsValidationService } from '../../../shared/services/skills-validation.service';
import { UserRepository } from '../../../users/repository/users.repository';
import { CreateProfileDto } from '../../dto/create-profile.dto';
import { ProfileRepository } from '../../repository/profile.repository';

@Injectable()
export class CreateProfileUseCase {
  constructor(
    private readonly profileRepo: ProfileRepository,
    private readonly userRepo: UserRepository,
    private readonly userBaseService: UserBaseService,
    private readonly skillsValidationService: SkillsValidationService,
    private readonly profileSkillRepo: ProfileSkillRepository,
  ) {}

  async execute(dto: CreateProfileDto) {
    // Log para debug
    console.log('CreateProfileDto received:', {
      documentNumber: dto.documentNumber,
      documentTypeId: dto.documentTypeId,
      name: dto.name,
      lastName: dto.lastName,
    });

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

    // Validar educación con las mismas reglas que experiencia
    if (dto.education && dto.education.length > 0) {
      for (let i = 0; i < dto.education.length; i++) {
        const edu = dto.education[i];
        if (edu.isCurrent && edu.endDate) {
          throw new UserBadRequestException(
            `Education item ${i + 1}: endDate must be empty when isCurrent is true`,
          );
        }
      }
    }

    // Validar que las habilidades existan si se proporcionan
    if (dto.skills && dto.skills.length > 0) {
      const validationResult =
        await this.skillsValidationService.validateSkillsExist(dto.skills);
      if (!validationResult.valid) {
        throw new UserBadRequestException(
          `Skills with IDs [${validationResult.invalidIds.join(', ')}] do not exist`,
        );
      }
    }

    const userId = dto.userId;
    // Confirmar existencia de usuario
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundByIdException(userId);

    const existingProfile = await this.profileRepo.findByUserId(userId);

    // Si el perfil existe, verificar si está vacío (creado durante la verificación)
    if (existingProfile) {
      const isEmpty =
        (!existingProfile.name || existingProfile.name.trim() === '') &&
        (!existingProfile.lastName || existingProfile.lastName.trim() === '') &&
        (!existingProfile.documentNumber ||
          existingProfile.documentNumber.trim() === '');

      // Si el perfil tiene datos, no permitir crear otro
      if (!isEmpty) {
        throw new UserBadRequestException(
          'Profile already exists for this user',
        );
      }

      // Si el perfil está vacío, actualizarlo
      console.log('Updating empty profile with data:', {
        profileId: existingProfile.id,
        documentNumber: dto.documentNumber,
        documentTypeId: dto.documentTypeId,
        name: dto.name,
        lastName: dto.lastName,
      });

      // Preparar datos para actualizar (excluir userId y skills que no son columnas de Profile)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId, skills, ...updateData } = dto;
      const updatedProfile = await this.profileRepo.update(existingProfile.id, {
        ...updateData,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      });

      console.log('Empty profile updated:', {
        id: updatedProfile?.id,
        documentNumber: updatedProfile?.documentNumber,
        documentTypeId: updatedProfile?.documentTypeId,
      });

      // Actualizar las relaciones profile-skill si se proporcionan habilidades
      if (dto.skills && dto.skills.length > 0) {
        // Primero eliminar las habilidades existentes
        await this.profileSkillRepo.deleteByProfileId(existingProfile.id);
        // Crear las nuevas habilidades
        await this.profileSkillRepo.createProfileSkills(
          existingProfile.id,
          dto.skills,
        );
      }

      return updatedProfile;
    }

    // Si no existe perfil, crear uno nuevo
    console.log('Creating new profile with data:', {
      documentNumber: dto.documentNumber,
      documentTypeId: dto.documentTypeId,
      name: dto.name,
      lastName: dto.lastName,
      profession: dto.profession,
    });

    const newProfile = await this.profileRepo.create({
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
    });

    console.log('Profile created:', {
      id: newProfile.id,
      documentNumber: newProfile.documentNumber,
      documentTypeId: newProfile.documentTypeId,
    });

    // Crear las relaciones profile-skill si se proporcionan habilidades
    if (dto.skills && dto.skills.length > 0) {
      await this.profileSkillRepo.createProfileSkills(
        newProfile.id,
        dto.skills,
      );
    }

    return newProfile;
  }
}
