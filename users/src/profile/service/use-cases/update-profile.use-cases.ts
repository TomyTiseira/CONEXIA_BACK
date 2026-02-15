import { Inject, Injectable } from '@nestjs/common';
import { UserBaseService } from 'src/common/services/user-base.service';
import {
  UserBadRequestException,
  UserNotFoundByIdException,
} from '../../../common/exceptions/user.exceptions';
import { FileStorage } from '../../../common/domain/interfaces/file-storage.interface';
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
    @Inject('FILE_STORAGE') private readonly fileStorage: FileStorage,
  ) {}

  async execute(dto: UpdateProfileDto) {
    // Obtener userId
    const userId = dto.userId;

    // Buscar perfil existente
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new UserNotFoundByIdException(userId);

    // Process file uploads if file data is provided
    let profilePictureUrl: string | undefined;
    let coverPictureUrl: string | undefined;

    try {
      if (dto.profilePictureData) {
        const buffer = Buffer.from(dto.profilePictureData, 'base64');
        const filename = this.generateFilename(
          userId,
          'profile',
          dto.profilePictureOriginalName,
        );
        profilePictureUrl = await this.fileStorage.upload(
          buffer,
          filename,
          dto.profilePictureMimetype,
        );
      } else if (dto.profilePicture !== undefined) {
        // Keep existing value if provided (could be string or null)
        profilePictureUrl = dto.profilePicture;
      }

      if (dto.coverPictureData) {
        const buffer = Buffer.from(dto.coverPictureData, 'base64');
        const filename = this.generateFilename(
          userId,
          'cover',
          dto.coverPictureOriginalName,
        );
        coverPictureUrl = await this.fileStorage.upload(
          buffer,
          filename,
          dto.coverPictureMimetype,
        );
      } else if (dto.coverPicture !== undefined) {
        // Keep existing value if provided (could be string or null)
        coverPictureUrl = dto.coverPicture;
      }
    } catch {
      // If upload fails, clean up any uploaded files
      if (profilePictureUrl) {
        await this.fileStorage.delete(profilePictureUrl).catch(() => {});
      }
      if (coverPictureUrl) {
        await this.fileStorage.delete(coverPictureUrl).catch(() => {});
      }
      throw new UserBadRequestException('Failed to upload images');
    }

    // Validar imágenes (solo si se envían como strings - legacy)
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

    // Solo actualizar campos permitidos (documentNumber, documentTypeId, birthDate NO se pueden actualizar)
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.profession !== undefined) updateData.profession = dto.profession;
    if (dto.areaCode !== undefined) updateData.areaCode = dto.areaCode;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (profilePictureUrl !== undefined)
      updateData.profilePicture = profilePictureUrl;
    if (coverPictureUrl !== undefined)
      updateData.coverPicture = coverPictureUrl;
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

    // Verificar si el perfil está completo y actualizar el flag en la tabla users
    const isProfileComplete = this.checkProfileComplete(updatedProfile);

    // Obtener el usuario asociado y actualizar isProfileComplete si es necesario
    const user = await this.userRepo.findById(userId);
    if (user && user.isProfileComplete !== isProfileComplete) {
      await this.userRepo.update(userId, { isProfileComplete });
    }

    return updatedProfile;
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
    const hasDocumentType =
      profile.documentTypeId !== null && profile.documentTypeId !== undefined;

    return allFieldsFilled && hasDocumentType;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private isValidImage(_imageUrl: string): boolean {
    // Implementar validación de imagen si es necesario
    return true;
  }

  /**
   * Generate a unique filename for uploaded files
   */
  private generateFilename(
    userId: number,
    type: 'profile' | 'cover',
    originalName?: string,
  ): string {
    const timestamp = Date.now();
    // Sanitize extension: only allow alphanumeric characters
    const rawExtension = originalName ? originalName.split('.').pop() : 'jpg';
    const extension =
      rawExtension?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
    return `${type}-${userId}-${timestamp}.${extension}`;
  }
}
