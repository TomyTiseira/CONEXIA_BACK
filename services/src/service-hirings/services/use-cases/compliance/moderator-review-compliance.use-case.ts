import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModeratorReviewComplianceDto } from '../../../dto/compliance.dto';
import { ClaimCompliance } from '../../../entities/claim-compliance.entity';
import { ComplianceStatus } from '../../../enums/compliance.enum';
import { ClaimComplianceRepository } from '../../../repositories/claim-compliance.repository';

/**
 * Use case para que un moderador revise y apruebe/rechace finalmente un compliance
 */
@Injectable()
export class ModeratorReviewComplianceUseCase {
  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
  ) {}

  async execute(dto: ModeratorReviewComplianceDto): Promise<ClaimCompliance> {
    // 1. Buscar el compliance
    const compliance = await this.complianceRepository.findOne({
      where: { id: dto.complianceId },
      relations: ['claim'],
    });
    if (!compliance) {
      throw new NotFoundException(
        `Compliance con ID ${dto.complianceId} no encontrado`,
      );
    }

    // 2. Validar que esté en un estado revisable
    const reviewableStatuses = [
      ComplianceStatus.SUBMITTED,
      ComplianceStatus.PEER_APPROVED,
      ComplianceStatus.PEER_OBJECTED,
      ComplianceStatus.IN_REVIEW,
    ];

    if (!reviewableStatuses.includes(compliance.status)) {
      throw new BadRequestException(
        `No se puede revisar un compliance en estado ${compliance.status}`,
      );
    }

    // 3. Procesar según decisión del moderador
    if (dto.decision === 'approve') {
      // APROBADO ✅
      compliance.status = ComplianceStatus.APPROVED;
      compliance.reviewedAt = new Date();
      compliance.reviewedBy = dto.moderatorId;
      compliance.moderatorNotes = dto.moderatorNotes || null;
      compliance.rejectionReason = null;

      console.log(
        `[ModeratorReviewComplianceUseCase] Compliance ${compliance.id} APROBADO por moderador ${dto.moderatorId}`,
      );

      // TODO: Notificar al responsable que fue aprobado
      // TODO: Verificar si hay más compliances pendientes en el claim
    } else if (dto.decision === 'adjust') {
      // REQUIERE AJUSTE (no es rechazo completo)
      compliance.status = ComplianceStatus.REQUIRES_ADJUSTMENT;
      compliance.reviewedAt = new Date();
      compliance.reviewedBy = dto.moderatorId;
      compliance.moderatorNotes =
        dto.adjustmentInstructions ||
        dto.moderatorNotes ||
        'Requiere ajustes menores';
      compliance.rejectionReason = null;

      console.log(
        `[ModeratorReviewComplianceUseCase] Compliance ${compliance.id} requiere ajuste`,
      );

      // TODO: Notificar al responsable que debe ajustar
    } else {
      // RECHAZADO ❌
      compliance.status = ComplianceStatus.REJECTED;
      compliance.reviewedAt = new Date();
      compliance.reviewedBy = dto.moderatorId;
      compliance.moderatorNotes = dto.moderatorNotes || null;
      compliance.rejectionReason =
        dto.rejectionReason || 'No cumple con los requisitos';
      compliance.rejectionCount += 1;

      console.log(
        `[ModeratorReviewComplianceUseCase] Compliance ${compliance.id} RECHAZADO (conteo: ${compliance.rejectionCount})`,
      );

      // TODO: Evaluar si activar consecuencias por rechazo
      // TODO: Notificar al responsable del rechazo
    }

    await this.complianceRepository.save(compliance);

    return compliance;
  }
}
