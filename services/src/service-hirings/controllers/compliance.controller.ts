import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ClaimCompliance } from '../entities/claim-compliance.entity';
import { ClaimComplianceRepository } from '../repositories/claim-compliance.repository';
import { CreateComplianceUseCase } from '../services/use-cases/compliance/create-compliance.use-case';
import { ModeratorReviewComplianceUseCase } from '../services/use-cases/compliance/moderator-review-compliance.use-case';
import { PeerReviewComplianceUseCase } from '../services/use-cases/compliance/peer-review-compliance.use-case';
import { SubmitComplianceByClaimUseCase } from '../services/use-cases/compliance/submit-compliance-by-claim.use-case';
import { SubmitComplianceUseCase } from '../services/use-cases/compliance/submit-compliance.use-case';

/**
 * Controller para gestionar cumplimientos via NATS microservice
 */
@Controller()
export class ComplianceController {
  constructor(
    private readonly createComplianceUseCase: CreateComplianceUseCase,
    private readonly submitComplianceByClaimUseCase: SubmitComplianceByClaimUseCase,
    private readonly submitComplianceUseCase: SubmitComplianceUseCase,
    private readonly peerReviewUseCase: PeerReviewComplianceUseCase,
    private readonly moderatorReviewUseCase: ModeratorReviewComplianceUseCase,
    private readonly complianceRepository: ClaimComplianceRepository,
  ) {}

  /**
   * Obtener lista de compliances con filtros
   * Pattern: getCompliances
   */
  @MessagePattern('getCompliances')
  async getCompliances(@Payload() query: any) {
    const { claimId, userId, status, onlyOverdue } = query;
    const page = query.page || 1;
    const limit = query.limit || 10;

    let compliances;
    let total = 0;

    try {
      // Aplicar filtros
      if (claimId) {
        compliances = await this.complianceRepository.findByClaimId(claimId);
        total = compliances.length;
      } else if (userId && status) {
        // Parsear status (puede venir como "pending,submitted")
        const statusArray =
          typeof status === 'string' ? status.split(',') : [status];

        const allCompliances =
          await this.complianceRepository.findByResponsibleUser(userId);
        compliances = allCompliances.filter((c) =>
          statusArray.includes(c.status),
        );
        total = compliances.length;

        // Paginación
        compliances = compliances.slice((page - 1) * limit, page * limit);
      } else if (userId) {
        compliances = await this.complianceRepository.findPendingByUser(userId);
        total = compliances.length;
      } else if (onlyOverdue) {
        compliances = await this.complianceRepository.findOverdue();
        total = compliances.length;
      } else {
        compliances = await this.complianceRepository.find({
          order: { deadline: 'ASC' },
          skip: (page - 1) * limit,
          take: limit,
        });
        total = await this.complianceRepository.count();
      }

      const data = compliances.map((c) => this.mapToDto(c));

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      console.error('[ComplianceController] Error en getCompliances:', error);
      throw error;
    }
  }

  /**
   * Obtener compliance por ID
   * Pattern: getComplianceById
   */
  @MessagePattern('getComplianceById')
  async getComplianceById(@Payload() payload: { id: string }) {
    try {
      const compliance = await this.complianceRepository.findOne({
        where: { id: payload.id },
        relations: ['claim'],
      });

      if (!compliance) {
        throw new Error(`Compliance ${payload.id} no encontrado`);
      }

      return this.mapToDto(compliance);
    } catch (error) {
      console.error(
        '[ComplianceController] Error en getComplianceById:',
        error,
      );
      throw error;
    }
  }

  /**
   * Usuario envía evidencia
   * Pattern: submitCompliance
   */
  @MessagePattern('submitCompliance')
  async submitCompliance(@Payload() dto: any) {
    try {
      const result = await this.submitComplianceUseCase.execute(dto);
      return this.mapToDto(result);
    } catch (error) {
      console.error('[ComplianceController] Error en submitCompliance:', error);
      throw error;
    }
  }

  /**
   * Usuario envía evidencia de cumplimiento identificando por claimId
   * Pattern: submitComplianceByClaim
   */
  @MessagePattern('submitComplianceByClaim')
  async submitComplianceByClaim(
    @Payload()
    payload: {
      claimId: string;
      userId: string;
      userNotes?: string;
      evidenceUrls?: string[];
    },
  ) {
    try {
      const result = await this.submitComplianceByClaimUseCase.execute({
        claimId: payload.claimId,
        userId: payload.userId,
        userNotes: payload.userNotes,
        evidenceUrls: payload.evidenceUrls,
      });
      return this.mapToDto(result);
    } catch (error) {
      console.error(
        '[ComplianceController] Error en submitComplianceByClaim:',
        error,
      );
      throw error;
    }
  }

  /**
   * Peer review (contraparte revisa)
   * Pattern: peerReviewCompliance
   */
  @MessagePattern('peerReviewCompliance')
  async peerReviewCompliance(@Payload() dto: any) {
    try {
      const result = await this.peerReviewUseCase.execute(dto);
      return this.mapToDto(result);
    } catch (error) {
      console.error(
        '[ComplianceController] Error en peerReviewCompliance:',
        error,
      );
      throw error;
    }
  }

  /**
   * Moderador toma decisión final
   * Pattern: moderatorReviewCompliance
   */
  @MessagePattern('moderatorReviewCompliance')
  async moderatorReviewCompliance(@Payload() dto: any) {
    try {
      const result = await this.moderatorReviewUseCase.execute(dto);
      return this.mapToDto(result);
    } catch (error) {
      console.error(
        '[ComplianceController] Error en moderatorReviewCompliance:',
        error,
      );
      throw error;
    }
  }

  /**
   * Obtener estadísticas de usuario
   * Pattern: getUserComplianceStats
   */
  @MessagePattern('getUserComplianceStats')
  async getUserComplianceStats(@Payload() payload: { userId: string }) {
    try {
      return await this.complianceRepository.getUserComplianceStats(
        payload.userId,
      );
    } catch (error) {
      console.error(
        '[ComplianceController] Error en getUserComplianceStats:',
        error,
      );
      throw error;
    }
  }

  /**
   * Helper para mapear entidad a DTO
   */
  private mapToDto(compliance: ClaimCompliance) {
    return {
      id: compliance.id,
      claimId: compliance.claimId,
      responsibleUserId: compliance.responsibleUserId,
      complianceType: compliance.complianceType,
      status: compliance.status,
      deadline: compliance.deadline,
      extendedDeadline: compliance.extendedDeadline,
      finalDeadline: compliance.finalDeadline,
      originalDeadlineDays: compliance.originalDeadlineDays,
      moderatorInstructions: compliance.moderatorInstructions,
      evidenceUrls: compliance.evidenceUrls,
      userNotes: compliance.userNotes,
      submittedAt: compliance.submittedAt,
      peerReviewedBy: compliance.peerReviewedBy,
      peerApproved: compliance.peerApproved,
      peerObjection: compliance.peerObjection,
      peerReviewedAt: compliance.peerReviewedAt,
      reviewedBy: compliance.reviewedBy,
      reviewedAt: compliance.reviewedAt,
      moderatorNotes: compliance.moderatorNotes,
      rejectionReason: compliance.rejectionReason,
      rejectionCount: compliance.rejectionCount,
      warningLevel: compliance.warningLevel,
      appealed: compliance.appealed,
      dependsOn: compliance.dependsOn,
      orderNumber: compliance.orderNumber,
      requirement: compliance.requirement,
      amount: compliance.amount,
      currency: compliance.currency,
      paymentLink: compliance.paymentLink,
      autoApproved: compliance.autoApproved,
      requiresFiles: compliance.requiresFiles,
      isOverdue: compliance.isOverdue(),
      createdAt: compliance.createdAt,
      updatedAt: compliance.updatedAt,
    };
  }
}
