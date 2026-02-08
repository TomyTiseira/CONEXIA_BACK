import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import {
  calculatePagination,
  PaginationInfo,
} from '../../../common/utils/pagination.utils';
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

      // Mapear todos los compliances con información completa y sus acciones disponibles
      const compliancesData = claimCompliances.map((compliance) => {
        const complianceActions: string[] = ['view_detail'];
        const isResponsible =
          compliance.responsibleUserId?.toString() === userId.toString();
        const isOtherParty =
          !isResponsible &&
          (userRole === 'claimant' || userRole === 'respondent');

        // Acciones para el responsable del compliance
        if (isResponsible) {
          if (
            [
              ComplianceStatus.PENDING,
              ComplianceStatus.OVERDUE,
              ComplianceStatus.WARNING,
              ComplianceStatus.ESCALATED,
              ComplianceStatus.REQUIRES_ADJUSTMENT,
            ].includes(compliance.status)
          ) {
            complianceActions.push('submit_evidence');
          }
        }

        // Acciones para la otra parte (peer review)
        // PEER REVIEW ES OBLIGATORIO - solo si está submitted y NO revisado aún
        if (
          isOtherParty &&
          compliance.status === ComplianceStatus.SUBMITTED &&
          !compliance.peerReviewedBy
        ) {
          complianceActions.push('peer_approve');
          complianceActions.push('peer_object');
        }

        const timeRemaining = compliance.getTimeRemaining();
        const daysOverdue = compliance.getDaysOverdue();
        const overdueStatus = compliance.getOverdueStatus();
        const canStillSubmit = compliance.canStillSubmit();

        return {
          id: compliance.id,
          claimId: compliance.claimId,
          responsibleUserId: compliance.responsibleUserId,
          complianceType: compliance.complianceType,
          status: compliance.status,
          moderatorInstructions: compliance.moderatorInstructions,
          deadline: compliance.deadline,
          evidenceUrls: compliance.evidenceUrls || [],
          userNotes: compliance.userNotes,
          submittedAt: compliance.submittedAt,

          // Peer review fields
          peerReviewedBy: compliance.peerReviewedBy,
          peerApproved: compliance.peerApproved,
          peerReviewReason: compliance.peerReviewReason,
          peerReviewedAt: compliance.peerReviewedAt,

          // Moderator review fields
          reviewedBy: compliance.reviewedBy,
          reviewedAt: compliance.reviewedAt,
          moderatorNotes: compliance.moderatorNotes,
          rejectionReason: compliance.rejectionReason,

          // Tracking fields
          currentAttempt: compliance.currentAttempt || 1,
          maxAttempts: compliance.maxAttempts || 3,
          rejectionCount: compliance.rejectionCount || 0,
          warningLevel: compliance.warningLevel || 0,
          hasActiveWarning: compliance.hasActiveWarning || false,

          // HISTORIAL COMPLETO DE INTENTOS
          submissions: compliance.submissions
            ? compliance.submissions.map((sub) => ({
                id: sub.id,
                attemptNumber: sub.attemptNumber,
                status: sub.status,
                evidenceUrls: sub.evidenceUrls,
                userNotes: sub.userNotes,
                submittedAt: sub.submittedAt,
                peerReviewedBy: sub.peerReviewedBy,
                peerApproved: sub.peerApproved,
                peerReviewReason: sub.peerReviewReason,
                peerReviewedAt: sub.peerReviewedAt,
                reviewedBy: sub.reviewedBy,
                reviewedAt: sub.reviewedAt,
                moderatorDecision: sub.moderatorDecision,
                moderatorNotes: sub.moderatorNotes,
                rejectionReason: sub.rejectionReason,
                createdAt: sub.createdAt,
                updatedAt: sub.updatedAt,
              }))
            : [],

          createdAt: compliance.createdAt,
          updatedAt: compliance.updatedAt,
          availableActions: complianceActions,
        };
      });

      const availableActions: string[] = ['view_detail'];
      if (userRole === 'respondent' && claim.status === 'open') {
        availableActions.push('submit_observations');
      }
      if (userRole === 'claimant' && claim.status === 'pending_clarification') {
        availableActions.push('submit_clarification');
      }

      // Verificar si el usuario tiene CUALQUIER compliance pendiente donde es responsable
      const hasPendingCompliances = claimCompliances.some(
        (c) =>
          c.responsibleUserId?.toString() === userId.toString() &&
          [
            ComplianceStatus.PENDING,
            ComplianceStatus.OVERDUE,
            ComplianceStatus.WARNING,
            ComplianceStatus.ESCALATED,
            ComplianceStatus.REQUIRES_ADJUSTMENT,
          ].includes(c.status),
      );

      if (hasPendingCompliances) {
        availableActions.push('submit_compliance_evidence');
      }

      if (userRole === 'claimant' && claim.status === 'resolved') {
        availableActions.push('create_review');
      }

      // Cancelación: solo el denunciante, solo si no está cerrado (resolved/rejected/cancelled).
      if (
        userRole === 'claimant' &&
        [
          'open',
          'in_review',
          'pending_clarification',
          'requires_staff_response',
        ].includes(String(claim.status))
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
              name: otherFirstName,
              lastName: otherLastName,
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
        compliances: compliancesData, // Agregar array completo de compliances
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
