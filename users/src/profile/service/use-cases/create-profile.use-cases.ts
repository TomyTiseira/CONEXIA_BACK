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

      // Preparar datos para actualizar (excluir userId y skills que no son columnas de Profile)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId, skills, ...updateData } = dto;
      const updatedProfile = await this.profileRepo.update(existingProfile.id, {
        ...updateData,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
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

      // Verificar si el perfil está completo y actualizar el flag en la tabla users
      const isProfileComplete = this.checkProfileComplete(updatedProfile);
      
      // Actualizar isProfileComplete en la tabla users si es necesario
      if (user.isProfileComplete !== isProfileComplete) {
        await this.userRepo.update(userId, { isProfileComplete });
      }

      return updatedProfile;
    }

    const newProfile = await this.profileRepo.create({
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
    });

    // Crear las relaciones profile-skill si se proporcionan habilidades
    if (dto.skills && dto.skills.length > 0) {
      await this.profileSkillRepo.createProfileSkills(
        newProfile.id,
        dto.skills,
      );
    }

    // Verificar si el perfil está completo y actualizar el flag en la tabla users
    const isProfileComplete = this.checkProfileComplete(newProfile);
    
    // Actualizar isProfileComplete en la tabla users
    await this.userRepo.update(userId, { isProfileComplete });

    return newProfile;
  }

  private checkProfileComplete(profile: any): boolean {
    // Campos obligatorios para considerar el perfil completo
    // 1. name (not null and not empty)
    // 2. lastName (not null and not empty)
    // 3. profession (not null and not empty)
    // 4. documentTypeId (not null)
    // 5. documentNumber (not null and not empty)
    
    const requiredFields = [
      profile.name,
      profile.lastName,
      profile.profession,
      profile.documentNumber,
    ];

    // Verificar que todos los campos obligatorios estén presentes y no vacíos
    const allFieldsFilled = requiredFields.every(
      (field) => field !== null && field !== undefined && field.trim() !== '',
    );

    // Verificar que documentTypeId no sea null
    const hasDocumentType = profile.documentTypeId !== null && profile.documentTypeId !== undefined;

    return allFieldsFilled && hasDocumentType;
  }
}
