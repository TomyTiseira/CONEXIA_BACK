import { Injectable } from '@nestjs/common';
import { UserBaseService } from 'src/common/services/user-base.service';
import {
  UserBadRequestException,
  UserNotFoundByIdException,
} from '../../../common/exceptions/user.exceptions';
import { ProfileSkillRepository } from '../../../shared/repository/profile-skill.repository';
import { SkillsValidationService } from '../../../shared/services/skills-validation.service';
import { UserRepository } from '../../../users/repository/users.repository';
import { UpdateProfileDto } from '../../dto/update-profile.dto';
import { ProfileRepository } from '../../repository/profile.repository';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    private readonly profileRepo: ProfileRepository,
    private readonly userRepo: UserRepository,
    private readonly userBaseService: UserBaseService,
    private readonly skillsValidationService: SkillsValidationService,
    private readonly profileSkillRepo: ProfileSkillRepository,
  ) {}

  async execute(dto: UpdateProfileDto) {
    // Obtener userId
    const userId = dto.userId;

    // Buscar perfil existente
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new UserNotFoundByIdException(userId);

    // Validar imágenes (solo si se envían)
    if (dto.profilePicture && !this.isValidImage(dto.profilePicture)) {
      throw new UserBadRequestException(
        'Invalid profile picture format or size',
      );
    }
    if (dto.coverPicture && !this.isValidImage(dto.coverPicture)) {
      throw new UserBadRequestException('Invalid cover picture format or size');
    }

    // Validar experiencia (igual que en create)
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

    // Solo actualizar campos permitidos
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.profession !== undefined) updateData.profession = dto.profession;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.profilePicture !== undefined)
      updateData.profilePicture = dto.profilePicture;
    if (dto.coverPicture !== undefined)
      updateData.coverPicture = dto.coverPicture;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.experience !== undefined) updateData.experience = dto.experience;
    if (dto.socialLinks !== undefined) updateData.socialLinks = dto.socialLinks;
    if (dto.education !== undefined) updateData.education = dto.education;
    if (dto.certifications !== undefined)
      updateData.certifications = dto.certifications;

    // Actualizar el perfil
    const updatedProfile = await this.profileRepo.update(
      profile.id,
      updateData,
    );

    // Actualizar habilidades si se proporcionan
    if (dto.skills !== undefined) {
      // Eliminar habilidades existentes
      await this.profileSkillRepo.deleteByProfileId(profile.id);

      // Crear nuevas habilidades si se proporcionan
      if (dto.skills.length > 0) {
        await this.profileSkillRepo.createProfileSkills(profile.id, dto.skills);
      }
    }

    return updatedProfile;
  }

  private isValidImage(imageUrl: string): boolean {
    console.log('imageUrl', imageUrl);
    // Implementar validación de imagen si es necesario
    return true;
  }
}
