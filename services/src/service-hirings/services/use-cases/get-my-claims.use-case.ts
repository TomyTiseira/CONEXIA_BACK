import { Injectable } from '@nestjs/common';
import {
  calculatePagination,
  PaginationInfo,
} from '../../../common/utils/pagination.utils';
import { UsersClientService } from '../../../common/services/users-client.service';
import { GetMyClaimsDto } from '../../dto/get-my-claims.dto';
import { ComplianceStatus } from '../../enums/compliance.enum';
import { ClaimComplianceRepository } from '../../repositories/claim-compliance.repository';
import { ClaimRepository } from '../../repositories/claim.repository';

@Injectable()
export class GetMyClaimsUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(
    userId: number,
    filters: GetMyClaimsDto,
  ): Promise<{ claims: any[]; pagination: PaginationInfo }> {
    const { claims, total } = await this.claimRepository.findMyClaims(
      userId,
      filters,
    );

    // Batch users: claimant + other party
    const otherUserIds = claims
      .map((c) => this.claimRepository.getOtherUserIdForClaim(c, userId))
      .filter((id): id is number => typeof id === 'number');

    const claimantIds = claims.map((c) => c.claimantUserId);

    const allUserIds = Array.from(new Set([...claimantIds, ...otherUserIds]));

    const users =
      allUserIds.length > 0
        ? await this.usersClientService.getUsersByIds(allUserIds)
        : [];
    const usersMap = new Map<number, any>();
    users.forEach((u) => usersMap.set(u.id, u));

    // Batch compliances by claim
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

    const mapped = claims.map((claim) => {
      const userRole = this.claimRepository.getUserRoleForClaim(claim, userId);
      const otherUserId = this.claimRepository.getOtherUserIdForClaim(
        claim,
        userId,
      );
      const otherUser =
        typeof otherUserId === 'number' ? usersMap.get(otherUserId) : null;

      const otherFirstName =
        otherUser?.profile?.firstName ||
        otherUser?.profile?.name ||
        otherUser?.profile?.first_name ||
        null;
      const otherLastName =
        otherUser?.profile?.lastName || otherUser?.profile?.last_name || null;
      const otherName =
        otherFirstName && otherLastName
          ? `${otherFirstName} ${otherLastName}`
          : otherFirstName || null;

      const claimCompliances = compliancesByClaim.get(claim.id) || [];
      // pick first compliance that is not approved (or first)
      const pendingCompliance =
        claimCompliances.find((c) => c.status !== ComplianceStatus.APPROVED) ||
        claimCompliances[0] ||
        null;

      const deadline = pendingCompliance?.deadline
        ? new Date(pendingCompliance.deadline)
        : null;
      const daysRemaining = deadline
        ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      const availableActions: string[] = ['view_detail'];
      if (userRole === 'respondent' && claim.status === 'open') {
        availableActions.push('submit_observations');
      }
      if (userRole === 'claimant' && claim.status === 'pending_clarification') {
        availableActions.push('submit_clarification');
      }
      if (
        pendingCompliance &&
        pendingCompliance.responsibleUserId?.toString() === userId.toString()
      ) {
        availableActions.push('upload_compliance');
      }
      if (userRole === 'claimant' && claim.status === 'resolved') {
        availableActions.push('create_review');
      }

      // Cancelación: solo el denunciante, solo si no está cerrado (resolved/rejected/cancelled).
      if (
        userRole === 'claimant' &&
        ['open', 'in_review', 'pending_clarification', 'requires_staff_response'].includes(String(claim.status))
      ) {
        availableActions.push('cancel_claim');
      }

      return {
        id: claim.id,
        hiringId: claim.hiringId,
        claimType: claim.claimType,
        status: claim.status,
        userRole,
        otherUser: otherUserId
          ? {
              id: otherUserId,
              name: otherName,
              username:
                otherUser?.username || otherUser?.profile?.username || null,
              profilePicture:
                otherUser?.profile?.profilePicture ||
                otherUser?.profile?.avatar ||
                otherUser?.profile?.picture ||
                null,
              roleName: otherUser?.role?.name || null,
            }
          : null,
        relatedService: claim.hiring?.service
          ? {
              id: claim.hiring.service.id,
              title: claim.hiring.service.title,
              hiringId: claim.hiring.id,
            }
          : null,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        compliance: pendingCompliance
          ? {
              id: pendingCompliance.id,
              type: pendingCompliance.complianceType,
              status: pendingCompliance.status,
              deadline: pendingCompliance.deadline,
              daysRemaining,
            }
          : null,
        availableActions,
      };
    });

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;

    return {
      claims: mapped,
      pagination: calculatePagination(total, { page, limit }),
    };
  }
}
