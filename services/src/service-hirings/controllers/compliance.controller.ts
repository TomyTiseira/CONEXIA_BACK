import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ClaimCompliance } from '../entities/claim-compliance.entity';
import { ClaimComplianceRepository } from '../repositories/claim-compliance.repository';
import { CheckOverdueCompliancesUseCase } from '../services/use-cases/compliance/check-overdue-compliances.use-case';
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
    private readonly checkOverdueCompliancesUseCase: CheckOverdueCompliancesUseCase,
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
        compliances = await this.complianceRepository.find({
          where: { claimId },
          relations: ['submissions'],
          order: { orderNumber: 'ASC', createdAt: 'ASC' },
        });
        total = compliances.length;
      } else if (userId && status) {
        // Parsear status (puede venir como "pending,submitted")
        const statusArray =
          typeof status === 'string' ? status.split(',') : [status];

        const allCompliances = await this.complianceRepository.find({
          where: { responsibleUserId: userId },
          relations: ['submissions'],
          order: { deadline: 'ASC' },
        });
        compliances = allCompliances.filter((c) =>
          statusArray.includes(c.status),
        );
        total = compliances.length;

        // Paginación
        compliances = compliances.slice((page - 1) * limit, page * limit);
      } else if (userId) {
        compliances = await this.complianceRepository.find({
          where: { responsibleUserId: userId },
          relations: ['submissions'],
          order: { deadline: 'ASC' },
        });
        total = compliances.length;
      } else if (onlyOverdue) {
        compliances = await this.complianceRepository.findOverdue();
        // Cargar submissions manualmente para cada compliance
        for (const c of compliances) {
          await this.complianceRepository
            .findOne({
              where: { id: c.id },
              relations: ['submissions'],
            })
            .then((loaded) => {
              if (loaded) c.submissions = loaded.submissions;
            });
        }
        total = compliances.length;
      } else {
        compliances = await this.complianceRepository.find({
          relations: ['submissions'],
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
        relations: ['claim', 'submissions'],
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
   * Usuario envía evidencia de cumplimiento específico
   * Pattern: submitComplianceByClaim
   */
  @MessagePattern('submitComplianceByClaim')
  async submitComplianceByClaim(
    @Payload()
    payload: {
      claimId: string;
      complianceId: string;
      userId: string;
      userNotes?: string;
      evidenceUrls?: string[];
    },
  ) {
    try {
      const result = await this.submitComplianceByClaimUseCase.execute({
        claimId: payload.claimId,
        complianceId: payload.complianceId,
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
      deadline: compliance.deadline,
      extendedDeadline: compliance.extendedDeadline,
      finalDeadline: compliance.finalDeadline,
      originalDeadlineDays: compliance.originalDeadlineDays,
      currentAttempt: compliance.currentAttempt,
      moderatorInstructions: compliance.moderatorInstructions,
      evidenceUrls: compliance.evidenceUrls,
      userNotes: compliance.userNotes,
      submittedAt: compliance.submittedAt,
      peerReviewedBy: compliance.peerReviewedBy,
      peerApproved: compliance.peerApproved,
      peerReviewReason: compliance.peerReviewReason,
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

      // NUEVOS CAMPOS PARA FRONTEND - ESTADO DE VENCIMIENTO
      daysOverdue, // Número de días vencido (0 si no está vencido)
      overdueStatus, // NOT_OVERDUE | FIRST_WARNING | SUSPENDED | BANNED
      canStillSubmit, // Si aún puede subir evidencia (hasta 5 días vencido)
      timeRemaining: {
        days: timeRemaining.days,
        hours: timeRemaining.hours,
        totalHours: timeRemaining.totalHours,
        isOverdue: timeRemaining.isOverdue,
      },

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
    };
  }

  /**
   * Ejecutar manualmente el cron job de compliances vencidos (para testing)
   * Pattern: runOverdueCompliancesJob
   */
  @MessagePattern('runOverdueCompliancesJob')
  async runOverdueCompliancesJob() {
    try {
      console.log(
        '[ComplianceController] Ejecutando manualmente verificación de compliances vencidos...',
      );
      await this.checkOverdueCompliancesUseCase.checkOverdueCompliances();
      return {
        success: true,
        message: 'Verificación de compliances vencidos ejecutada exitosamente',
      };
    } catch (error) {
      console.error(
        '[ComplianceController] Error ejecutando job de compliances vencidos:',
        error,
      );
      throw error;
    }
  }

  /**
   * Ejecutar manualmente el envío de recordatorios de plazos (para testing)
   * Pattern: runDeadlineRemindersJob
   */
  @MessagePattern('runDeadlineRemindersJob')
  async runDeadlineRemindersJob() {
    try {
      console.log(
        '[ComplianceController] Ejecutando manualmente envío de recordatorios de plazos...',
      );
      await this.checkOverdueCompliancesUseCase.sendDeadlineReminders();
      return {
        success: true,
        message: 'Recordatorios de plazos enviados exitosamente',
      };
    } catch (error) {
      console.error(
        '[ComplianceController] Error ejecutando job de recordatorios:',
        error,
      );
      throw error;
    }
  }
}
