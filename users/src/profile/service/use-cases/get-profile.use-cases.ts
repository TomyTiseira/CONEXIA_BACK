import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ProfileNotFoundException } from 'src/common/exceptions/user.exceptions';
import { NATS_SERVICE } from 'src/config';
import { Skill } from '../../../shared/interfaces/skill.interface';
import { ConnectionInfoService } from '../../../shared/services/connection-info.service';
import { ConversationInfoService } from '../../../shared/services/conversation-info.service';
import { SkillsValidationService } from '../../../shared/services/skills-validation.service';
import {
    ProfileSkillResponse,
    ProfileWithSkills,
} from '../../../shared/types/skill.types';
import { UserReviewRepository } from '../../../user-reviews/repository/user-review.repository';
import { GetProfileDto } from '../../dto/get-profile.dto';
import { ProfileRepository } from '../../repository/profile.repository';

interface PlanResponse {
  plan?: {
    id: string;
    name: string;
    [key: string]: unknown;
  } | null;
}

@Injectable()
export class GetProfileUseCase {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly skillsValidationService: SkillsValidationService,
    private readonly connectionInfoService: ConnectionInfoService,
    private readonly conversationInfoService: ConversationInfoService,
    private readonly userReviewRepository: UserReviewRepository,
    @Inject(NATS_SERVICE) private readonly natsClient: ClientProxy,
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
      verified: profile.user?.verified || false,
      skills: skills.map(
        (skill: Skill): ProfileSkillResponse => ({
          id: skill.id,
          name: skill.name,
        }),
      ),
    };

    // Eliminar profileSkills y user de la respuesta de forma segura
    if ('profileSkills' in transformedProfile) {
      (transformedProfile as any).profileSkills = undefined;
    }
    if ('user' in transformedProfile) {
      (transformedProfile as any).user = undefined;
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

    // Obtener la información de conversación entre los usuarios
    const conversationInfo =
      await this.conversationInfoService.getConversationInfo(
        getProfileDto.authenticatedUser.id,
        getProfileDto.targetUserId,
      );

    // Agregar el ID de conversación al perfil
    transformedProfile.conversationId = conversationInfo?.id || null;

    // Verificar si el usuario autenticado ya hizo una reseña al usuario del perfil
    let hasReviewed = false;
    if (!isOwner) {
      const existingReview =
        await this.userReviewRepository.findByReviewerAndReviewed(
          getProfileDto.authenticatedUser.id,
          getProfileDto.targetUserId,
        );
      hasReviewed = !!existingReview;
    }

    // Obtener información del plan/suscripción del usuario
    let userPlan: PlanResponse['plan'] = null;
    try {
      const planResponse = await firstValueFrom<PlanResponse>(
        this.natsClient.send('getUserPlan', {
          userId: getProfileDto.targetUserId,
        }),
      );
      userPlan = planResponse?.plan || null;
    } catch {
      // Si hay error al obtener el plan, simplemente no lo incluimos
      console.warn(
        `No se pudo obtener el plan del usuario ${getProfileDto.targetUserId}`,
      );
    }

    // Agregar información de baneo/suspensión
    const isBanned = profile.user?.accountStatus === 'banned';
    const isSuspended = profile.user?.accountStatus === 'suspended';
    const suspensionExpiresAt = profile.user?.suspensionExpiresAt || null;

    return {
      profile: transformedProfile,
      isOwner,
      hasReviewed,
      plan: userPlan,
      isBanned,
      isSuspended,
      suspensionExpiresAt,
    } as any;
  }
}
