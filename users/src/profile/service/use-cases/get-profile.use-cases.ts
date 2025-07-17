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

    // Determinar si el usuario autenticado es el propietario del perfil
    const isOwner =
      getProfileDto.authenticatedUser.id === getProfileDto.targetUserId;

    return {
      profile,
      isOwner,
    };
  }
}
