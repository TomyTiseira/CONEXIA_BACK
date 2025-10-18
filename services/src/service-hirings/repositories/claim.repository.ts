import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
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
   * Verifica si hay cualquier reclamo activo (OPEN o IN_REVIEW)
   */
  async hasActiveClaim(hiringId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: [
        { hiringId, status: ClaimStatus.OPEN },
        { hiringId, status: ClaimStatus.IN_REVIEW },
      ],
    });
    return count > 0;
  }

  async findWithFilters(filters: {
    hiringId?: number;
    status?: ClaimStatus;
    claimantRole?: ClaimRole;
    page?: number;
    limit?: number;
  }): Promise<{ claims: Claim[]; total: number }> {
    const { hiringId, status, claimantRole, page = 1, limit = 10 } = filters;

    const where: FindOptionsWhere<Claim> = {};

    if (hiringId) where.hiringId = hiringId;
    if (status) where.status = status;
    if (claimantRole) where.claimantRole = claimantRole;

    const [claims, total] = await this.repository.findAndCount({
      where,
      relations: ['hiring', 'hiring.service', 'hiring.status'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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
  ): Promise<Claim | null> {
    await this.repository.update(id, {
      status,
      resolution,
      resolvedBy,
      resolvedAt: new Date(),
    });
    return await this.findById(id);
  }
}
