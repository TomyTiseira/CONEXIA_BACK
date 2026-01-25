import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import {
  calculatePagination,
  PaginationInfo,
} from '../../../common/utils/pagination.utils';
import { ClaimResponseDto } from '../../dto/claim-response.dto';
import { GetClaimsDto } from '../../dto/get-claims.dto';
import { ClaimTypeLabels } from '../../enums/claim.enum';
import { ComplianceStatus } from '../../enums/compliance.enum';
import { ClaimComplianceRepository } from '../../repositories/claim-compliance.repository';
import { ClaimRepository } from '../../repositories/claim.repository';

@Injectable()
export class GetClaimsUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly usersClientService: UsersClientService,
    private readonly complianceRepository: ClaimComplianceRepository,
  ) {}

  async execute(
    filters: GetClaimsDto,
  ): Promise<{ claims: any[]; pagination: PaginationInfo }> {
    const { claims, total } =
      await this.claimRepository.findWithFilters(filters);

    // Buscar usuarios relacionados (claimantUserId + resolvedBy + claimedUserId) en batch para optimizar
    const claimantIds = Array.from(
      new Set(claims.map((c) => c.claimantUserId)),
    );
    const resolverIds = Array.from(
      new Set(
        claims
          .filter((c) => c.resolvedBy !== null)
          .map((c) => c.resolvedBy as number),
      ),
    );
    // Agregar IDs de usuarios reclamados (cliente o proveedor según el rol)
    const claimedIds = Array.from(
      new Set(
        claims
          .filter((c) => c.hiring)
          .map((c) => {
            if (c.claimantRole === 'client') {
              return c.hiring?.service?.userId;
            } else if (c.claimantRole === 'provider') {
              return c.hiring?.userId;
            }
            return null;
          })
          .filter((id): id is number => id !== null),
      ),
    );
    const allUserIds = [
      ...new Set([...claimantIds, ...resolverIds, ...claimedIds]),
    ];

    const users =
      allUserIds.length > 0
        ? await this.usersClientService.getUsersByIds(allUserIds)
        : [];
    const usersMap = new Map<number, any>();
    users.forEach((u) => usersMap.set(u.id, u));

    // Batch compliances by claim (para acciones/admin)
    const claimIds = claims.map((c) => c.id);
    const compliances =
      claimIds.length > 0
        ? await this.complianceRepository.findByClaimIds(claimIds)
        : [];

    const compliancesByClaim = new Map<string, any[]>();
    for (const compliance of compliances) {
      const list = compliancesByClaim.get(compliance.claimId) || [];
      list.push(compliance);
      compliancesByClaim.set(compliance.claimId, list);
    }

    const pickProfile = (user: any) => {
      const profile = user?.profile || {};
      const name =
        profile?.firstName || profile?.name || profile?.first_name || null;
      const lastName = profile?.lastName || profile?.last_name || null;
      const profilePicture =
        profile?.profilePicture || profile?.avatar || profile?.picture || null;
      return {
        profile: {
          id: user?.id ?? null,
          name,
          lastName,
          profilePicture,
        },
      };
    };

    const claimResponses = claims.map((claim) => {
      const claimTypeLabel = ClaimTypeLabels[claim.claimType];

      const claimant = usersMap.get(claim.claimantUserId);

      // Identificar usuario reclamado (según el rol del reclamante)
      let otherUserId: number | null = null;
      if (claim.hiring) {
        if (claim.claimantRole === 'client') {
          otherUserId = claim.hiring.service?.userId || null;
        } else if (claim.claimantRole === 'provider') {
          otherUserId = claim.hiring.userId || null;
        }
      }
      const otherUser = otherUserId ? usersMap.get(otherUserId) : null;

      // Resolver (moderador/admin) - enviar id + emailPrefix
      let resolvedByUser: any = null;
      let resolvedByEmailPrefix: string | null = null;
      if (claim.resolvedBy) {
        resolvedByUser = usersMap.get(claim.resolvedBy) || null;
        if (resolvedByUser?.email) {
          resolvedByEmailPrefix = resolvedByUser.email.split('@')[0] || null;
        }
      }

      const claimCompliances = compliancesByClaim.get(claim.id) || [];
      const pendingCompliance =
        claimCompliances.find((c) => c.status !== ComplianceStatus.APPROVED) ||
        claimCompliances[0] ||
        null;

      const availableActions: string[] = ['view_detail'];

      // Moderación
      if (claim.status === 'open') {
        availableActions.push('mark_in_review');
      }
      if (claim.status === 'in_review') {
        availableActions.push('add_observations');
        availableActions.push('resolve_claim');
      }
      if (claim.status === 'requires_staff_response') {
        // Cuando el usuario ya subsanó, solo permitir resolver/rechazar (no más observaciones).
        availableActions.push('resolve_claim');
      }

      // Cumplimientos
      if (
        pendingCompliance &&
        [
          ComplianceStatus.SUBMITTED,
          ComplianceStatus.PEER_APPROVED,
          ComplianceStatus.PEER_OBJECTED,
          ComplianceStatus.IN_REVIEW,
        ].includes(pendingCompliance.status)
      ) {
        availableActions.push('review_compliance');
      }

      // Mapear todos los compliances con información completa
      const compliancesData = claimCompliances.map((compliance) => ({
        id: compliance.id,
        claimId: compliance.claimId,
        responsibleUserId: compliance.responsibleUserId,
        complianceType: compliance.complianceType,
        status: compliance.status,
        moderatorInstructions: compliance.moderatorInstructions,
        deadline: compliance.deadline,
        evidenceUrls: compliance.evidenceUrls || [],
        userNotes: compliance.userNotes,
        moderatorNotes: compliance.moderatorNotes,
        rejectionReason: compliance.rejectionReason,
        rejectionCount: compliance.rejectionCount || 0,
        createdAt: compliance.createdAt,
        updatedAt: compliance.updatedAt,
      }));

      return {
        claim: {
          id: claim.id,
          hiringId: claim.hiringId,
          claimantUserId: claim.claimantUserId,
          claimantRole: claim.claimantRole,
          claimType: claim.claimType,
          claimTypeLabel,
          description: claim.description,
          otherReason: claim.otherReason,
          evidenceUrls: claim.evidenceUrls,
          clarificationEvidenceUrls:
            (claim as any).clarificationEvidenceUrls ?? [],
          status: claim.status,
          observations: claim.observations,
          observationsBy: claim.observationsBy,
          observationsAt: claim.observationsAt,
          respondentObservations: claim.respondentObservations,
          respondentEvidenceUrls: claim.respondentEvidenceUrls,
          respondentObservationsBy: claim.respondentObservationsBy,
          respondentObservationsAt: claim.respondentObservationsAt,
          clarificationResponse: (claim as any).clarificationResponse ?? null,
          resolution: claim.resolution,
          resolutionType: claim.resolutionType,
          partialAgreementDetails: claim.partialAgreementDetails,
          resolvedBy: claim.resolvedBy,
          resolvedAt: claim.resolvedAt,
          createdAt: claim.createdAt,
          updatedAt: claim.updatedAt,
        },
        claimant: pickProfile(claimant),
        otherUser: pickProfile(otherUser),
        hiring: {
          id: claim.hiring?.id ?? null,
          status: claim.hiring?.status
            ? {
                id: claim.hiring.status.id,
                name: claim.hiring.status.name,
                code: (claim.hiring.status as any).code ?? null,
              }
            : null,
          service: {
            id: claim.hiring?.service?.id ?? null,
            title: claim.hiring?.service?.title ?? null,
          },
        },
        assignedModerator: {
          id: (claim as any).assignedModeratorId ?? null,
          email: (claim as any).assignedModeratorEmail ?? null,
        },
        compliance: pendingCompliance
          ? {
              id: pendingCompliance.id,
              status: pendingCompliance.status,
              deadline: pendingCompliance.deadline ?? null,
              responsibleUserId: pendingCompliance.responsibleUserId ?? null,
            }
          : null,
        compliances: compliancesData, // Agregar array completo de compliances
        availableActions,
        resolvedBy: {
          id: resolvedByUser?.id ?? null,
          emailPrefix: resolvedByEmailPrefix,
        },
      };
    });

    return {
      claims: claimResponses,
      pagination: calculatePagination(total, {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
      }),
    };
  }

  async findByHiring(hiringId: number): Promise<ClaimResponseDto[]> {
    const claims = await this.claimRepository.findByHiringId(hiringId);

    // For single hiring, fetch claimant users as well
    const claimantIds = Array.from(
      new Set(claims.map((c) => c.claimantUserId)),
    );
    const users =
      claimantIds.length > 0
        ? await this.usersClientService.getUsersByIds(claimantIds)
        : [];
    const usersMap = new Map<number, any>();
    users.forEach((u) => usersMap.set(u.id, u));

    return claims.map((claim) => {
      const claimTypeLabel = ClaimTypeLabels[claim.claimType];
      const user = usersMap.get(claim.claimantUserId);

      // Construir nombre completo
      const fullFirstName =
        user?.profile?.firstName || user?.profile?.name || null;
      // Extraer solo el primer nombre (primera palabra)
      const claimantFirstName = fullFirstName
        ? fullFirstName.split(' ')[0]
        : null;
      const claimantLastName = user?.profile?.lastName || null;
      const claimantName =
        fullFirstName && claimantLastName
          ? `${fullFirstName} ${claimantLastName}`
          : fullFirstName || null;

      return ClaimResponseDto.fromEntity(claim, {
        claimTypeLabel,
        claimantName,
        claimantFirstName,
        claimantLastName,
      });
    });
  }

  async findById(claimId: string): Promise<ClaimResponseDto | null> {
    const claim = await this.claimRepository.findById(claimId);

    if (!claim) {
      return null;
    }

    const claimTypeLabel = ClaimTypeLabels[claim.claimType];

    // Usar getUserByIdWithRelations para obtener el profile completo del reclamante
    const user = await this.usersClientService.getUserByIdWithRelations(
      claim.claimantUserId,
    );

    // Construir nombre completo del reclamante
    const fullFirstName =
      user?.profile?.firstName || user?.profile?.name || null;
    // Extraer solo el primer nombre (primera palabra)
    const claimantFirstName = fullFirstName
      ? fullFirstName.split(' ')[0]
      : null;
    const claimantLastName = user?.profile?.lastName || null;
    const claimantName =
      fullFirstName && claimantLastName
        ? `${fullFirstName} ${claimantLastName}`
        : fullFirstName || null;

    // Identificar y buscar usuario reclamado
    let claimedUserId: number | null = null;
    let claimedUserName: string | null = null;
    let claimedUserFirstName: string | null = null;
    let claimedUserLastName: string | null = null;

    if (claim.hiring) {
      // Si el reclamante es cliente, el reclamado es el proveedor
      if (claim.claimantRole === 'client') {
        claimedUserId = claim.hiring.service?.userId || null;
      }
      // Si el reclamante es proveedor, el reclamado es el cliente
      else if (claim.claimantRole === 'provider') {
        claimedUserId = claim.hiring.userId || null;
      }

      // Buscar info del usuario reclamado
      if (claimedUserId) {
        const claimedUser =
          await this.usersClientService.getUserByIdWithRelations(claimedUserId);
        if (claimedUser) {
          const fullClaimedFirstName =
            claimedUser.profile?.firstName || claimedUser.profile?.name || null;
          // Extraer solo el primer nombre (primera palabra)
          claimedUserFirstName = fullClaimedFirstName
            ? fullClaimedFirstName.split(' ')[0]
            : null;
          claimedUserLastName = claimedUser.profile?.lastName || null;
          claimedUserName =
            fullClaimedFirstName && claimedUserLastName
              ? `${fullClaimedFirstName} ${claimedUserLastName}`
              : fullClaimedFirstName || null;
        }
      }
    }

    // Información del moderador/admin que resolvió (solo prefijo del email)
    let resolvedByEmail: string | null = null;
    if (claim.resolvedBy) {
      const resolver = await this.usersClientService.getUserByIdWithRelations(
        claim.resolvedBy,
      );
      if (resolver && resolver.email) {
        // Extraer solo el prefijo antes del @
        const emailPrefix = resolver.email.split('@')[0];
        resolvedByEmail = emailPrefix || null;
      }
    }

    return ClaimResponseDto.fromEntity(claim, {
      claimTypeLabel,
      claimantName,
      claimantFirstName,
      claimantLastName,
      claimedUserId,
      claimedUserName,
      claimedUserFirstName,
      claimedUserLastName,
      resolvedByEmail,
    });
  }
}
