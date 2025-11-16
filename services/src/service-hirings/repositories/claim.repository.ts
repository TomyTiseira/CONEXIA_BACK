import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from '../entities/claim.entity';
import { ClaimRole, ClaimStatus } from '../enums/claim.enum';

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
      ],
    });
    return count > 0;
  }

  async findWithFilters(filters: {
    hiringId?: number;
    status?: ClaimStatus;
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

    const queryBuilder = this.repository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.hiring', 'hiring')
      .leftJoinAndSelect('hiring.service', 'service')
      .leftJoinAndSelect('hiring.status', 'status');

    // Filtros básicos
    if (hiringId) {
      queryBuilder.andWhere('claim.hiringId = :hiringId', { hiringId });
    }
    if (status) {
      queryBuilder.andWhere('claim.status = :status', { status });
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
    },
  ): Promise<Claim | null> {
    const claim = await this.findById(id);
    if (!claim) return null;

    const updates: any = {
      status: ClaimStatus.OPEN, // Vuelve a estado OPEN después de subsanar
    };

    // Si hay nueva respuesta de subsanación, actualizarla (NO pisa la descripción original)
    if (updateData.clarificationResponse) {
      updates.clarificationResponse = updateData.clarificationResponse;
    }

    // Si hay nuevas evidencias, agregarlas a las existentes
    if (updateData.evidenceUrls && updateData.evidenceUrls.length > 0) {
      const existingUrls = claim.evidenceUrls || [];
      updates.evidenceUrls = [...existingUrls, ...updateData.evidenceUrls];
    }

    await this.repository.update(id, updates);
    return await this.findById(id);
  }
}
