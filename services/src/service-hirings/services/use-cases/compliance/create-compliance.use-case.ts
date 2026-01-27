import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ComplianceRequirement,
  ComplianceStatus,
  ComplianceType,
} from '../../../enums/compliance.enum';
import { ClaimComplianceRepository } from '../../../repositories/claim-compliance.repository';
import { ClaimRepository } from '../../../repositories/claim.repository';
import { ClaimCompliance } from '../../../entities/claim-compliance.entity';

export interface CreateComplianceDto {
  claimId: string;
  responsibleUserId: string | number;
  type?: ComplianceType; // Deprecated, usar complianceType
  complianceType?: ComplianceType;
  moderatorInstructions: string;
  requiresFiles?: boolean;
  deadlineDays: number;
  dependsOn?: string;
  requirement?: ComplianceRequirement;
  amount?: number;
  currency?: string;
  order?: number;
}

/**
 * Use case para crear nuevos compliances después de resolver un reclamo
 */
@Injectable()
export class CreateComplianceUseCase {
  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly claimRepository: ClaimRepository,
  ) {}

  async execute(dto: CreateComplianceDto): Promise<ClaimCompliance> {
    // 1. Validar que el claim existe
    const claim = await this.claimRepository.findById(dto.claimId);
    if (!claim) {
      throw new NotFoundException(`Claim con ID ${dto.claimId} no encontrado`);
    }

    // 2. Obtener el tipo de compliance (priorizar complianceType)
    const complianceType = dto.complianceType || dto.type;
    if (!complianceType) {
      throw new Error('complianceType es requerido');
    }

    // 3. Calcular deadline basado en días
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + dto.deadlineDays);

    // 4. Determinar orden de dependencia
    let orderNumber = dto.order !== undefined ? dto.order : 0;
    if (orderNumber === 0) {
      if (dto.dependsOn) {
        const parentCompliance = await this.complianceRepository.findOne({
          where: { id: dto.dependsOn },
        });
        if (parentCompliance) {
          orderNumber = parentCompliance.orderNumber + 1;
        }
      } else {
        // Si no depende de nadie, contar cuántos compliances ya existen para este claim
        const existingCompliances = await this.complianceRepository.find({
          where: { claimId: dto.claimId },
        });
        orderNumber = existingCompliances.length;
      }
    }

    // 5. Crear el compliance
    const compliance = this.complianceRepository.create({
      claimId: dto.claimId,
      responsibleUserId: String(dto.responsibleUserId),
      complianceType,
      status: ComplianceStatus.PENDING,
      moderatorInstructions: dto.moderatorInstructions,
      requiresFiles: dto.requiresFiles !== undefined ? dto.requiresFiles : true,
      deadline,
      dependsOn: dto.dependsOn || null,
      orderNumber,
      requirement: dto.requirement || ComplianceRequirement.SEQUENTIAL,
      amount: dto.amount || null,
      currency: dto.currency || 'ARS',
      rejectionCount: 0,
      warningLevel: 0,
      appealed: false,
      autoApproved: false,
      originalDeadlineDays: dto.deadlineDays,
    });

    const saved = await this.complianceRepository.save(compliance);

    console.log(
      `[CreateComplianceUseCase] Compliance creado: ${saved.id} para usuario ${dto.responsibleUserId}`,
    );

    return saved;
  }
}
