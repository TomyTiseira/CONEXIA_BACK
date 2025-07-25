import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../../auth/service/token.service';
import {
  UserBadRequestException,
  UserNotFoundByIdException,
} from '../../../common/exceptions/user.exceptions';
import { UserRepository } from '../../../users/repository/users.repository';
import { UpdateProfileDto } from '../../dto/update-profile.dto';
import { ProfileRepository } from '../../repository/profile.repository';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    private readonly profileRepo: ProfileRepository,
    private readonly userRepo: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: UpdateProfileDto) {
    // Validar token y obtener usuario
    const payload = this.tokenService.verifyToken(dto.token);
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }
    const userId = payload.sub;

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

    // Solo actualizar campos permitidos
    const updateData: any = {};
    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.lastName !== undefined) {
      updateData.lastName = dto.lastName;
    }
    if (dto.profilePicture !== undefined) {
      updateData.profilePicture = dto.profilePicture;
    }
    if (dto.coverPicture !== undefined) {
      updateData.coverPicture = dto.coverPicture;
    }
    if (dto.skills !== undefined) {
      updateData.skills = dto.skills;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    if (dto.experience !== undefined) {
      updateData.experience = dto.experience;
    }
    if (dto.country !== undefined) {
      updateData.country = dto.country;
    }
    if (dto.state !== undefined) {
      updateData.state = dto.state;
    }
    if (dto.phoneNumber !== undefined) {
      updateData.phoneNumber = dto.phoneNumber;
    }
    if (dto.socialLinks !== undefined) {
      updateData.socialLinks = dto.socialLinks;
    }

    const updated = await this.profileRepo.update(profile.id, updateData);
    return updated;
  }

  private isValidImage(image: string): boolean {
    // Validar extensión y tamaño (base64 string o filename)
    // Aquí solo ejemplo simple, deberías adaptar según cómo almacenas imágenes
    const allowed = ['.jpg', '.jpeg', '.png'];
    // const maxSize = 5 * 1024 * 1024; // 5MB
    const ext = image.split('.').pop()?.toLowerCase();
    if (!ext || !allowed.includes('.' + ext)) {
      return false;
    }
    // Si es base64, podrías validar el tamaño decodificando
    // Aquí solo ejemplo para filename
    return true;
  }
}
