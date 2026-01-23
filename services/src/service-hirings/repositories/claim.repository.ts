import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetMyClaimsDto } from '../dto/get-my-claims.dto';
import { Claim } from '../entities/claim.entity';
import { ClaimRole, ClaimStatus } from '../enums/claim.enum';

const VIRTUAL_CLAIM_STATUSES = {
  REQUIRES_RESPONSE: 'requires_response',
  PENDING_COMPLIANCE: 'pending_compliance',
  REVIEWING_COMPLIANCE: 'reviewing_compliance',
} as const;

const COMPLIANCE_ACTION_REQUIRED_STATUSES = [
  'pending',
  'overdue',
  'warning',
  'escalated',
  'requires_adjustment',
] as const;

const COMPLIANCE_REVIEW_STATUSES = [
  'submitted',
  'peer_approved',
  'peer_objected',
  'in_review',
] as const;

@Injectable()
export class ClaimRepository {
  constructor(
    @InjectRepository(Claim)
    private readonly repository: Repository<Claim>,
  ) {}

  async create(claimData: Partial<Claim>): Promise<Claim> {
    const claim = this.repository.create(claimData);
    return await this.repository.save(claim);
  }

  async findById(id: string): Promise<Claim | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['hiring', 'hiring.service', 'hiring.status'],
    });
  }

  async findByHiringId(hiringId: number): Promise<Claim[]> {
    return await this.repository.find({
      where: { hiringId },
      relations: ['hiring', 'hiring.service', 'hiring.status'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Determina si un usuario es parte del reclamo (claimant o respondent).
   * Nota: respondent se calcula desde el hiring/service (no se persiste en defendantUserId).
   */
  isUserPartyOfClaim(claim: Claim, userId: number): boolean {
    return (
      this.getUserRoleForClaim(claim, userId) === 'claimant' ||
      this.getUserRoleForClaim(claim, userId) === 'respondent'
    );
  }

  isUserRespondentOfClaim(claim: Claim, userId: number): boolean {
    return this.getUserRoleForClaim(claim, userId) === 'respondent';
  }

  getUserRoleForClaim(
    claim: Claim,
    userId: number,
  ): 'claimant' | 'respondent' | null {
    const normalizedUserId = Number(userId);
    if (Number(claim.claimantUserId) === normalizedUserId) return 'claimant';

    // Reclamado (respondent) depende del rol del reclamante
    const hiring = (claim as any).hiring;
    if (!hiring) return null;

    if (claim.claimantRole === 'client') {
      // claimant=client => respondent=provider (service owner)
      const providerId = hiring.service?.userId;
      if (Number(providerId) === normalizedUserId) return 'respondent';
    }

    if (claim.claimantRole === 'provider') {
      // claimant=provider => respondent=client
      const clientId = hiring.userId;
      if (Number(clientId) === normalizedUserId) return 'respondent';
    }

    return null;
  }

  getOtherUserIdForClaim(claim: Claim, userId: number): number | null {
    const role = this.getUserRoleForClaim(claim, userId);
    if (!role) return null;

    const hiring = (claim as any).hiring;
    if (!hiring) return null;

    if (role === 'claimant') {
      if (claim.claimantRole === 'client') {
        return hiring.service?.userId || null;
      }
      if (claim.claimantRole === 'provider') {
        return hiring.userId || null;
      }
    }

    // role === 'respondent' => other is claimant
    return claim.claimantUserId;
  }

  async findMyClaims(
    userId: number,
    filters: GetMyClaimsDto,
  ): Promise<{ claims: Claim[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 12;

    const qb = this.repository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.hiring', 'hiring')
      .leftJoinAndSelect('hiring.service', 'service')
      .leftJoinAndSelect('hiring.status', 'status');

    // user is claimant OR respondent (computed from claimantRole + hiring)
    qb.andWhere(
      `(
        claim.claimantUserId = :userId
        OR (claim.claimantRole = 'client' AND service.userId = :userId)
        OR (claim.claimantRole = 'provider' AND hiring.userId = :userId)
      )`,
      { userId },
    );

    const statusFilter =
      filters.status !== undefined && filters.status !== null
        ? String(filters.status).trim()
        : undefined;

    if (statusFilter) {
      // Virtual statuses used by frontend
      if (statusFilter === VIRTUAL_CLAIM_STATUSES.REQUIRES_RESPONSE) {
        // (A) claimant needs to respond to moderator => pending_clarification
        // (B) respondent needs to submit observations => open + respondentObservations is null
        qb.andWhere(
          `(
            (claim.status = :pendingClarification AND claim.claimantUserId = :userId)
            OR (
              claim.status = :open
              AND claim.respondentObservations IS NULL
              AND (
                (claim.claimantRole = 'client' AND service.userId = :userId)
                OR (claim.claimantRole = 'provider' AND hiring.userId = :userId)
              )
            )
          )`,
          {
            userId,
            open: ClaimStatus.OPEN,
            pendingClarification: ClaimStatus.PENDING_CLARIFICATION,
          },
        );
      } else if (statusFilter === VIRTUAL_CLAIM_STATUSES.PENDING_COMPLIANCE) {
        qb.andWhere(
          `EXISTS (
            SELECT 1
            FROM claim_compliances cc
            WHERE cc.claim_id = claim.id
              AND cc.responsible_user_id = :responsibleUserId
              AND cc.status = ANY(:actionStatuses)
          )`,
          {
            responsibleUserId: String(userId),
            actionStatuses: COMPLIANCE_ACTION_REQUIRED_STATUSES,
          },
        );
      } else if (
        statusFilter === VIRTUAL_CLAIM_STATUSES.REVIEWING_COMPLIANCE
      ) {
        qb.andWhere(
          `EXISTS (
            SELECT 1
            FROM claim_compliances cc
            WHERE cc.claim_id = claim.id
              AND cc.responsible_user_id = :responsibleUserId
              AND cc.status = ANY(:reviewStatuses)
          )`,
          {
            responsibleUserId: String(userId),
            reviewStatuses: COMPLIANCE_REVIEW_STATUSES,
          },
        );
      } else {
        // Normal ClaimStatus values
        qb.andWhere('claim.status = :status', { status: statusFilter });
      }
    }

    if (filters.role && filters.role !== 'all') {
      if (filters.role === 'claimant') {
        qb.andWhere('claim.claimantUserId = :userId', { userId });
      }
      if (filters.role === 'respondent') {
        qb.andWhere(
          `(
            (claim.claimantRole = 'client' AND service.userId = :userId)
            OR (claim.claimantRole = 'provider' AND hiring.userId = :userId)
          )`,
          { userId },
        );
      }
    }

    const sortBy = filters.sortBy || 'updatedAt';
    const sortOrder = (filters.sortOrder || 'desc').toUpperCase() as
      | 'ASC'
      | 'DESC';
    qb.orderBy(`claim.${sortBy}`, sortOrder);

    qb.skip((page - 1) * limit).take(limit);

    const [claims, total] = await qb.getManyAndCount();
    return { claims, total };
  }

  async setRespondentObservations(
    claimId: string,
    update: {
      respondentObservations: string;
      respondentEvidenceUrls: string[];
      respondentObservationsBy: number;
      respondentObservationsAt: Date;
      status: ClaimStatus;
    },
  ): Promise<void> {
    await this.repository.update(claimId, {
      respondentObservations: update.respondentObservations,
      respondentEvidenceUrls: update.respondentEvidenceUrls,
      respondentObservationsBy: update.respondentObservationsBy,
      respondentObservationsAt: update.respondentObservationsAt,
      status: update.status,
    } as any);
  }

  /**
   * Verifica si hay un reclamo abierto para un hiring específico
   */
  async hasOpenClaim(hiringId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        hiringId,
        status: ClaimStatus.OPEN,
      },
    });
    return count > 0;
  }

  /**
   * Verifica si hay cualquier reclamo activo (OPEN, IN_REVIEW o PENDING_CLARIFICATION)
   */
  async hasActiveClaim(hiringId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: [
        { hiringId, status: ClaimStatus.OPEN },
        { hiringId, status: ClaimStatus.IN_REVIEW },
        { hiringId, status: ClaimStatus.PENDING_CLARIFICATION },
        { hiringId, status: ClaimStatus.REQUIRES_STAFF_RESPONSE },
      ],
    });
    return count > 0;
  }

  async findWithFilters(filters: {
    hiringId?: number;
    status?: string;
    claimantRole?: ClaimRole;
    searchTerm?: string;
    page?: number;
    limit?: number;
  }): Promise<{ claims: Claim[]; total: number }> {
    const {
      hiringId,
      status,
      claimantRole,
      searchTerm,
      page = 1,
      limit = 10,
    } = filters;

    const statusFilter =
      status !== undefined && status !== null ? String(status).trim() : undefined;

    const queryBuilder = this.repository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.hiring', 'hiring')
      .leftJoinAndSelect('hiring.service', 'service')
      .leftJoinAndSelect('hiring.status', 'status');

    // Filtros básicos
    if (hiringId) {
      queryBuilder.andWhere('claim.hiringId = :hiringId', { hiringId });
    }
    if (statusFilter) {
      if (statusFilter === VIRTUAL_CLAIM_STATUSES.REQUIRES_RESPONSE) {
        // Claims waiting on user action: pending_clarification OR respondent pending observations
        queryBuilder.andWhere(
          `(
            claim.status = :pendingClarification
            OR (claim.status = :open AND claim.respondentObservations IS NULL)
          )`,
          {
            open: ClaimStatus.OPEN,
            pendingClarification: ClaimStatus.PENDING_CLARIFICATION,
          },
        );
      } else if (statusFilter === VIRTUAL_CLAIM_STATUSES.PENDING_COMPLIANCE) {
        queryBuilder.andWhere(
          `EXISTS (
            SELECT 1
            FROM claim_compliances cc
            WHERE cc.claim_id = claim.id
              AND cc.status = ANY(:actionStatuses)
          )`,
          {
            actionStatuses: COMPLIANCE_ACTION_REQUIRED_STATUSES,
          },
        );
      } else if (statusFilter === VIRTUAL_CLAIM_STATUSES.REVIEWING_COMPLIANCE) {
        queryBuilder.andWhere(
          `EXISTS (
            SELECT 1
            FROM claim_compliances cc
            WHERE cc.claim_id = claim.id
              AND cc.status = ANY(:reviewStatuses)
          )`,
          {
            reviewStatuses: COMPLIANCE_REVIEW_STATUSES,
          },
        );
      } else {
        queryBuilder.andWhere('claim.status = :status', { status: statusFilter });
      }
    }
    if (claimantRole) {
      queryBuilder.andWhere('claim.claimantRole = :claimantRole', {
        claimantRole,
      });
    }

    // Búsqueda por texto (ID del reclamo)
    if (searchTerm) {
      // Si el searchTerm parece un UUID completo, buscar por ID exacto
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(searchTerm)) {
        queryBuilder.andWhere('claim.id = :searchTerm', { searchTerm });
      } else {
        // Si no es UUID completo, buscar por ID parcial (convertir UUID a texto)
        queryBuilder.andWhere('LOWER(claim.id::text) LIKE LOWER(:searchTerm)', {
          searchTerm: `%${searchTerm}%`,
        });
      }
    }

    queryBuilder.orderBy('claim.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [claims, total] = await queryBuilder.getManyAndCount();

    return { claims, total };
  }

  async update(id: string, updateData: Partial<Claim>): Promise<Claim | null> {
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  async assignModeratorIfEmpty(
    claimId: string,
    moderatorId: number,
    moderatorEmail: string | null,
  ): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Claim)
      .set({
        assignedModeratorId: moderatorId,
        assignedModeratorEmail: moderatorEmail,
        assignedAt: () => 'NOW()',
      } as any)
      .where('id = :id', { id: claimId })
      .andWhere('assigned_moderator_id IS NULL')
      .execute();
  }

  async resolve(
    id: string,
    status: ClaimStatus.RESOLVED | ClaimStatus.REJECTED,
    resolution: string,
    resolvedBy: number,
    resolutionType?: string,
    partialAgreementDetails?: string,
  ): Promise<Claim | null> {
    await this.repository.update(id, {
      status,
      resolution,
      resolutionType: resolutionType as any,
      resolvedBy,
      resolvedAt: new Date(),
      ...(partialAgreementDetails && { partialAgreementDetails }),
    });
    return await this.findById(id);
  }

  async addObservations(
    id: string,
    observations: string,
    observationsBy: number,
  ): Promise<Claim | null> {
    await this.repository.update(id, {
      status: ClaimStatus.PENDING_CLARIFICATION,
      observations,
      observationsBy,
      observationsAt: new Date(),
    });
    return await this.findById(id);
  }

  async updateClaimEvidence(
    id: string,
    updateData: {
      clarificationResponse?: string;
      evidenceUrls?: string[];
      clarificationEvidenceUrls?: string[];
    },
  ): Promise<Claim | null> {
    const claim = await this.findById(id);
    if (!claim) return null;

    const updates: any = {
      // Luego de que el denunciante subsana, el flujo queda esperando acción del moderador/admin.
      // Esto evita confusión con IN_REVIEW (revisión inicial) y evita volver a OPEN.
      status: ClaimStatus.REQUIRES_STAFF_RESPONSE,
    };

    // Si hay nueva respuesta de subsanación, actualizarla (NO pisa la descripción original)
    if (updateData.clarificationResponse) {
      updates.clarificationResponse = updateData.clarificationResponse;
    }

    const newClarificationEvidenceUrls =
      (updateData.clarificationEvidenceUrls &&
      updateData.clarificationEvidenceUrls.length > 0
        ? updateData.clarificationEvidenceUrls
        : updateData.evidenceUrls) || [];

    // Si hay nuevas evidencias de subsanación, guardarlas separadas.
    if (newClarificationEvidenceUrls.length > 0) {
      updates.clarificationEvidenceUrls = newClarificationEvidenceUrls;
    }

    await this.repository.update(id, updates);
    return await this.findById(id);
  }
}
