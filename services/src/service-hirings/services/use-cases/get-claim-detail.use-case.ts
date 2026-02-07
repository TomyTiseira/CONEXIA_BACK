import {
  Injectable,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UsersClientService } from '../../../common/services/users-client.service';
import { ClaimComplianceRepository } from '../../repositories/claim-compliance.repository';
import { ClaimRepository } from '../../repositories/claim.repository';

@Injectable()
export class GetClaimDetailUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(params: {
    claimId: string;
    requesterId: number;
    isStaff: boolean;
  }) {
    const claim = await this.claimRepository.findById(params.claimId);
    if (!claim) {
      throw new RpcException({
        status: 404,
        message: `Reclamo con ID ${params.claimId} no encontrado`,
      });
    }

    if (!params.isStaff) {
      const isParty = this.claimRepository.isUserPartyOfClaim(
        claim,
        params.requesterId,
      );
      if (!isParty) {
        throw new RpcException({
          status: 403,
          message: 'No autorizado para ver este reclamo',
        });
      }
    }

    const userRole = this.claimRepository.getUserRoleForClaim(
      claim,
      params.requesterId,
    );
    const otherUserId = this.claimRepository.getOtherUserIdForClaim(
      claim,
      params.requesterId,
    );

    const [claimant, other] = await Promise.all([
      this.usersClientService.getUserByIdWithRelations(claim.claimantUserId),
      typeof otherUserId === 'number'
        ? this.usersClientService.getUserByIdWithRelations(otherUserId)
        : Promise.resolve(null),
    ]);

    const compliances = await this.complianceRepository.findByClaimId(claim.id);

    const pickProfile = (user: any) => {
      const profile = user?.profile;
      return {
        profile: {
          id: user?.id ?? null,
          name: profile?.name ?? null,
          lastName: profile?.lastName ?? null,
          profilePicture: profile?.profilePicture ?? null,
        },
      };
    };

    return {
      claim: {
        id: claim.id,
        claimType: claim.claimType,
        otherReason: claim.otherReason ?? null,
        status: claim.status,
        description: claim.description,
        evidenceUrls: claim.evidenceUrls,
        clarificationEvidenceUrls: (claim as any).clarificationEvidenceUrls || [],
        observations: claim.observations,
        observationsBy: claim.observationsBy,
        observationsAt: claim.observationsAt,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        userRole,
        respondentObservations: claim.respondentObservations,
        respondentEvidenceUrls: claim.respondentEvidenceUrls,
        respondentObservationsBy: claim.respondentObservationsBy,
        respondentObservationsAt: claim.respondentObservationsAt,
        clarificationResponse: claim.clarificationResponse,
        resolution: claim.resolution,
        resolutionType: claim.resolutionType,
        resolvedAt: claim.resolvedAt,
      },
      claimant: pickProfile(claimant),
      otherUser: pickProfile(other),
      hiring: {
        service: {
          id: claim.hiring?.service?.id ?? null,
          title: claim.hiring?.service?.title ?? null,
        },
      },
      assignedModerator: {
        id: (claim as any).assignedModeratorId ?? null,
        email: (claim as any).assignedModeratorEmail ?? null,
      },
      compliances: (compliances || []).map((c) => ({
        description: c.moderatorInstructions,
        evidenceUrls: c.evidenceUrls,
        submittedAt: c.submittedAt,
        status: c.status,
      })),
    };
  }
}
