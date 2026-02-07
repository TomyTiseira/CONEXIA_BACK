import { Injectable } from '@nestjs/common';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { ClaimCompliance } from '../entities/claim-compliance.entity';
import {
  ComplianceRequirement,
  ComplianceStatus,
} from '../enums/compliance.enum';

@Injectable()
export class ClaimComplianceRepository extends Repository<ClaimCompliance> {
  constructor(private dataSource: DataSource) {
    super(ClaimCompliance, dataSource.createEntityManager());
  }

  /**
   * Encuentra compliances por claim ID
   */
  async findByClaimId(claimId: string): Promise<ClaimCompliance[]> {
    return this.find({
      where: { claimId },
      order: { orderNumber: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Encuentra compliances por múltiples claims (para evitar N+1)
   */
  async findByClaimIds(claimIds: string[]): Promise<ClaimCompliance[]> {
    if (!claimIds.length) return [];
    return this.find({
      where: { claimId: In(claimIds) },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Encuentra compliances por usuario responsable
   */
  async findByResponsibleUser(userId: string): Promise<ClaimCompliance[]> {
    return this.find({
      where: { responsibleUserId: userId },
      order: { deadline: 'ASC' },
    });
  }

  /**
   * Encuentra compliances pendientes de un usuario
   */
  async findPendingByUser(userId: string): Promise<ClaimCompliance[]> {
    return this.find({
      where: {
        responsibleUserId: userId,
        status: In([
          ComplianceStatus.PENDING,
          ComplianceStatus.REQUIRES_ADJUSTMENT,
          ComplianceStatus.REJECTED,
        ]),
      },
      order: { deadline: 'ASC' },
    });
  }

  /**
   * Encuentra compliances que están vencidos
   */
  async findOverdue(): Promise<ClaimCompliance[]> {
    const now = new Date();

    return this.createQueryBuilder('compliance')
      .where('compliance.status IN (:...statuses)', {
        statuses: [ComplianceStatus.PENDING, ComplianceStatus.SUBMITTED],
      })
      .andWhere('compliance.appealed = false')
      .andWhere(
        '(compliance.deadline < :now OR compliance.extended_deadline < :now OR compliance.final_deadline < :now)',
        { now },
      )
      .orderBy('compliance.warning_level', 'DESC')
      .addOrderBy('compliance.deadline', 'ASC')
      .getMany();
  }

  /**
   * Encuentra compliances que necesitan revisión del moderador
   */
  async findPendingModeratorReview(): Promise<ClaimCompliance[]> {
    return this.find({
      where: {
        status: In([
          ComplianceStatus.SUBMITTED,
          ComplianceStatus.PEER_APPROVED,
          ComplianceStatus.PEER_OBJECTED,
        ]),
      },
      order: { submittedAt: 'ASC' },
    });
  }

  /**
   * Encuentra compliances que pueden ser revisados por peer
   */
  async findPendingPeerReview(claimId: string): Promise<ClaimCompliance[]> {
    return this.find({
      where: {
        claimId,
        status: ComplianceStatus.SUBMITTED,
        peerReviewedBy: IsNull(),
      },
    });
  }

  /**
   * Verifica si todos los compliances de un claim están aprobados
   */
  async areAllApproved(claimId: string): Promise<boolean> {
    const compliances = await this.findByClaimId(claimId);

    if (compliances.length === 0) {
      return true; // No hay compliances, consideramos aprobado
    }

    return compliances.every((c) => c.status === ComplianceStatus.APPROVED);
  }

  /**
   * Encuentra el siguiente compliance en la cadena (si es secuencial)
   */
  async findNextInChain(complianceId: string): Promise<ClaimCompliance | null> {
    return this.findOne({
      where: {
        dependsOn: complianceId,
      },
    });
  }

  /**
   * Encuentra compliances paralelos de un claim
   */
  async findParallelCompliances(claimId: string): Promise<ClaimCompliance[]> {
    return this.find({
      where: {
        claimId,
        requirement: ComplianceRequirement.PARALLEL,
      },
    });
  }

  /**
   * Cuenta compliances por estado
   */
  async countByStatus(status: ComplianceStatus): Promise<number> {
    return this.count({ where: { status } });
  }

  /**
   * Obtiene estadísticas de cumplimiento por usuario
   */
  async getUserComplianceStats(userId: string): Promise<{
    totalPending: number;
    totalCompleted: number;
    totalOverdue: number;
    averageCompletionDays: number;
    complianceRate: number;
  }> {
    const compliances = await this.find({
      where: { responsibleUserId: userId },
    });

    const completed = compliances.filter(
      (c) => c.status === ComplianceStatus.APPROVED,
    );
    const pending = compliances.filter(
      (c) =>
        c.status === ComplianceStatus.PENDING ||
        c.status === ComplianceStatus.SUBMITTED ||
        c.status === ComplianceStatus.REQUIRES_ADJUSTMENT,
    );
    const overdue = compliances.filter(
      (c) => c.warningLevel > 0 || c.status === ComplianceStatus.OVERDUE,
    );

    // Calcular promedio de días para cumplir
    const completedWithDays = completed.filter((c) => c.submittedAt);
    const totalDays = completedWithDays.reduce((sum, c) => {
      const days = Math.floor(
        (c.submittedAt!.getTime() - c.createdAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return sum + days;
    }, 0);

    const averageCompletionDays =
      completedWithDays.length > 0 ? totalDays / completedWithDays.length : 0;

    // Calcular tasa de cumplimiento
    const complianceRate =
      compliances.length > 0
        ? (completed.length / compliances.length) * 100
        : 0;

    return {
      totalPending: pending.length,
      totalCompleted: completed.length,
      totalOverdue: overdue.length,
      averageCompletionDays: Math.round(averageCompletionDays * 10) / 10,
      complianceRate: Math.round(complianceRate * 10) / 10,
    };
  }

  /**
   * Encuentra compliances próximos a vencer (24 horas)
   */
  async findExpiringSoon(): Promise<ClaimCompliance[]> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return this.createQueryBuilder('compliance')
      .where('compliance.status = :status', {
        status: ComplianceStatus.PENDING,
      })
      .andWhere('compliance.deadline BETWEEN :now AND :tomorrow', {
        now,
        tomorrow,
      })
      .orderBy('compliance.deadline', 'ASC')
      .getMany();
  }
}
