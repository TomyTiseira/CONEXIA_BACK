import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UsersClientService } from '../../../common/services/users-client.service';
import { ClaimComplianceRepository } from '../../repositories/claim-compliance.repository';
import { ClaimRepository } from '../../repositories/claim.repository';
import { ComplianceStatus } from 'src/service-hirings/enums/compliance.enum';

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

    // Obtener el perfil del usuario actual (requester) y del otro usuario
    const [yourUser, otherUser] = await Promise.all([
      this.usersClientService.getUserByIdWithRelations(params.requesterId),
      typeof otherUserId === 'number'
        ? this.usersClientService.getUserByIdWithRelations(otherUserId)
        : Promise.resolve(null),
    ]);

    const compliances = await this.complianceRepository.findByClaimId(claim.id);

    // Obtener email del resolvedor si existe
    let resolvedByEmail: string | null = null;
    if (claim.resolvedBy) {
      const resolver = await this.usersClientService.getUserByIdWithRelations(
        claim.resolvedBy,
      );
      resolvedByEmail = resolver?.email || null;
    }

    // Obtener compliance pendiente (primer compliance que no está aprobado)
    const pendingCompliance =
      compliances.find((c) => c.status !== ComplianceStatus.APPROVED) ||
      compliances[0] ||
      null;

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
        clarificationEvidenceUrls:
          (claim as any).clarificationEvidenceUrls || [],
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
        resolvedBy: claim.resolvedBy,
        resolvedByEmail,
      },
      yourProfile: pickProfile(yourUser),
      otherUserProfile: pickProfile(otherUser),
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
      compliance: pendingCompliance
        ? {
            id: pendingCompliance.id,
            type: pendingCompliance.complianceType,
            status: pendingCompliance.status,
            deadline: pendingCompliance.deadline ?? null,
            responsibleUserId: pendingCompliance.responsibleUserId ?? null,
          }
        : null,
      compliances: (compliances || []).map((c) => {
        const complianceActions: string[] = ['view_detail'];
        const isResponsible =
          c.responsibleUserId?.toString() === params.requesterId.toString();
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
            ].includes(c.status)
          ) {
            complianceActions.push('submit_evidence');
          }
        }

        // Acciones para la otra parte (peer review)
        // PEER REVIEW ES OBLIGATORIO - solo si está submitted y NO revisado aún
        if (
          isOtherParty &&
          c.status === ComplianceStatus.SUBMITTED &&
          !c.peerReviewedBy
        ) {
          complianceActions.push('peer_approve');
          complianceActions.push('peer_object');
        }

        // Acciones para moderadores/staff (solo después de peer review)
        if (
          params.isStaff &&
          ['peer_approved', 'peer_objected', 'in_review'].includes(c.status)
        ) {
          complianceActions.push('review_compliance');
        }

        const timeRemaining = c.getTimeRemaining();
        const daysOverdue = c.getDaysOverdue();
        const overdueStatus = c.getOverdueStatus();
        const canStillSubmit = c.canStillSubmit();

        return {
          id: c.id,
          claimId: c.claimId,
          responsibleUserId: c.responsibleUserId,
          complianceType: c.complianceType,
          status: c.status,
          moderatorInstructions: c.moderatorInstructions,
          deadline: c.deadline,
          evidenceUrls: c.evidenceUrls || [],
          userNotes: c.userNotes,

          // Peer review fields
          peerReviewedBy: c.peerReviewedBy,
          peerApproved: c.peerApproved,
          peerReviewReason: c.peerReviewReason,
          peerReviewedAt: c.peerReviewedAt,

          // Moderator review fields
          reviewedBy: c.reviewedBy,
          reviewedAt: c.reviewedAt,
          moderatorNotes: c.moderatorNotes,
          rejectionReason: c.rejectionReason,

          // Tracking fields
          currentAttempt: c.currentAttempt || 1,
          maxAttempts: c.maxAttempts || 3,
          rejectionCount: c.rejectionCount || 0,
          warningLevel: c.warningLevel || 0,
          hasActiveWarning: c.hasActiveWarning || false,

          // NUEVOS CAMPOS - Estado de vencimiento
          daysOverdue,
          overdueStatus,
          canStillSubmit,
          timeRemaining: {
            days: timeRemaining.days,
            hours: timeRemaining.hours,
            totalHours: timeRemaining.totalHours,
            isOverdue: timeRemaining.isOverdue,
          },

          // HISTORIAL COMPLETO DE INTENTOS
          submissions: c.submissions
            ? c.submissions.map((sub) => ({
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

          submittedAt: c.submittedAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          availableActions: complianceActions,
        };
      }),
    };
  }
}
