import { Injectable } from '@nestjs/common';
import { ProfileNotFoundException } from 'src/common/exceptions/user.exceptions';
import { Skill } from '../../../shared/interfaces/skill.interface';
import { ConnectionInfoService } from '../../../shared/services/connection-info.service';
import { SkillsValidationService } from '../../../shared/services/skills-validation.service';
import {
  ProfileSkillResponse,
  ProfileWithSkills,
} from '../../../shared/types/skill.types';
import { GetProfileDto } from '../../dto/get-profile.dto';
import { ProfileRepository } from '../../repository/profile.repository';

@Injectable()
export class GetProfileUseCase {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly skillsValidationService: SkillsValidationService,
    private readonly connectionInfoService: ConnectionInfoService,
  ) {}

  async execute(getProfileDto: GetProfileDto) {
    // Buscar el perfil del usuario objetivo
    const profile = await this.profileRepository.findByUserId(
      getProfileDto.targetUserId,
    );

    if (!profile) {
      throw new ProfileNotFoundException();
    }

    // Obtener información de skills desde el microservicio de proyectos
    let skills: Skill[] = [];
    if (profile.profileSkills && profile.profileSkills.length > 0) {
      const skillIds = profile.profileSkills.map((ps) => ps.skillId);
      skills = await this.skillsValidationService.getSkillsByIds(skillIds);
    }

    // Transformar profileSkills en skills
    const transformedProfile: ProfileWithSkills = {
      ...profile,
      skills: skills.map(
        (skill: Skill): ProfileSkillResponse => ({
          id: skill.id,
          name: skill.name,
        }),
      ),
    };

    // Eliminar profileSkills de la respuesta de forma segura
    if ('profileSkills' in transformedProfile) {
      (transformedProfile as any).profileSkills = undefined;
    }

    // Determinar si el usuario autenticado es el propietario del perfil
    const isOwner =
      getProfileDto.authenticatedUser.id === getProfileDto.targetUserId;

    // Obtener los datos de conexión entre los usuarios
    const connectionInfo = await this.connectionInfoService.getConnectionInfo(
      getProfileDto.authenticatedUser.id,
      getProfileDto.targetUserId,
    );

    // Agregar los datos de conexión al perfil
    if (connectionInfo) {
      transformedProfile.connectionData = {
        id: connectionInfo.id,
        state: connectionInfo.state,
        senderId: connectionInfo.senderId,
      };
    } else {
      transformedProfile.connectionData = null;
    }

    return {
      profile: transformedProfile,
      isOwner,
    };
  }
}
