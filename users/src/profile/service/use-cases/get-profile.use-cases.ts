import { Injectable } from '@nestjs/common';
import { ProfileNotFoundException } from 'src/common/exceptions/user.exceptions';
import { GetProfileDto } from '../../dto/get-profile.dto';
import { ProfileRepository } from '../../repository/profile.repository';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(getProfileDto: GetProfileDto) {
    // Buscar el perfil del usuario objetivo
    const profile = await this.profileRepository.findByUserId(
      getProfileDto.targetUserId,
    );

    if (!profile) {
      throw new ProfileNotFoundException();
    }

    // Transformar profileSkills en skills
    const transformedProfile = {
      ...profile,
      skills:
        profile.profileSkills?.map((ps) => ({
          id: ps.skill.id,
          name: ps.skill.name,
        })) || [],
    };

    // Eliminar profileSkills de la respuesta de forma segura
    if ('profileSkills' in transformedProfile) {
      (transformedProfile as any).profileSkills = undefined;
    }

    // Determinar si el usuario autenticado es el propietario del perfil
    const isOwner =
      getProfileDto.authenticatedUser.id === getProfileDto.targetUserId;

    return {
      profile: transformedProfile,
      isOwner,
    };
  }
}
